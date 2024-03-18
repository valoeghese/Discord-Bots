// process.on('message', message => {

// });

let commands = [];
const RAM_SIZE = 4096;

const REG_A = 0;
const REG_B = 1;
const REG_C = 2;
const REG_D = 3;

const REG_SP = 4;
const REG_PC = 5;

const REG_FL = 6;
// flags
const FLAGS_OV = 0x1;
const FLAGS_Z = 0x2;

class Process {
    constructor() {
        this.registers = new Uint32Array(7); // 4 registers + SP, PC, and Flags

        this.stackPointer = RAM_SIZE - 1;
        this.programCounter = 0;
        this.ram = []
        this.consts = new Uint8Array(256); // limited to 256 bytes
    }

    loadProcess(proc_bytes, proc_consts) {
        this.ram = proc_bytes
        this.consts = proc_consts
    }

    execNext() {
        let instruction = [this.programCounter++];
        let command = commands[(instruction >>> 24) & 0xFF];

        if (command) {
            command(this, instruction);
        }
    }

    clearFlags() {
        this.registers[REG_FL] = 0;
    }

    setFlags(flag_bits) {
        this.registers[REG_FL] |= flag_bits;
    }

    getFlag(flag_bit) {
        return (this.registers[REG_FL] & flag_bit) != 0;
    }
}

// 0 is reserved for No-OP

// 4 Bit Instructions
//====================

// 1: LDLow [reg] [16 bit const]
commands[1] = function LDLow(process, instruction) {
    const reg = (instruction >>> 16) & 0xFF;
    const constant = instruction & 0xFFFF;

    process.registers[reg] = (process.registers[reg] & 0xFFFF0000) | constant;
}

// 2: LDHigh [reg] [16 bit const]
commands[2] = function LDHigh(process, instruction) {
    const reg = (instruction >>> 16) & 0xFF;
    const constant = (instruction & 0xFFFF) << 16;

    process.registers[reg] = (process.registers[reg] & 0x0000FFFF) | constant;
}

// 3: MOV [storeg] [reg] <unused>
commands[3] = function MOV(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const reg = (instruction >>> 8) & 0xFF;

    process.registers[storeg] = process.registers[reg];
}

// 4: LOAD [reg] [ram address]
commands[4] = function LOAD(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const ramAddr = (instruction) & 0xFFFF;

    if (ramAddr >= RAM_SIZE) {
        throw new Error("Bus Error");
    }

    process.registers[storeg] = process.ram[ramAddr];
}

// 5: STOre [reg] [ram address]
commands[5] = function STOre(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const ramAddr = (instruction) & 0xFFFF;

    if (ramAddr >= RAM_SIZE) {
        throw new Error("Bus Error");
    }

    process.ram[ramAddr] = process.registers[storeg];
}

// A: ADD [storeg] [reg] [reg]
commands[0xA] = function ADD(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const reg1 = (instruction >>> 8) & 0xFF;
    const reg2 = (instruction) & 0xFF;
    
    const addition_unwrapped = process.registers[reg1] + process.registers[reg2];
    const addition = addition_unwrapped | 0;
    
    // set flags
    process.clearFlags();
    
    if (addition !== addition_unwrapped) {
        process.setFlags(FLAGS_OV);
    }

    if (addition === 0) {
        process.setFlags(FLAGS_Z);
    }

    process.registers[storeg] = addition;
}

// B: SUB [storeg] [reg] [reg]
commands[0xB] = function SUB(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const reg1 = (instruction >>> 8) & 0xFF;
    const reg2 = (instruction) & 0xFF;

    const subtract_unwrapped = process.registers[reg1] - process.registers[reg2];
    const subtract = subtract_unwrapped | 0;

    // set flags
    process.clearFlags();

    if (subtract !== subtract_unwrapped) {
        process.setFlags(FLAGS_OV);
    }

    if (subtract === 0) {
        process.setFlags(FLAGS_Z);
    }
    
    process.registers[storeg] = subtract;
}

// C: MUL [storeg] [reg] [reg]
commands[0xC] = function MUL(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const reg1 = (instruction >>> 8) & 0xFF;
    const reg2 = (instruction) & 0xFF;

    // set flags
    process.clearFlags();

    const mul = Math.imul(process.registers[reg1], process.registers[reg2]);

    if (mul === 0) {
        process.setFlags(FLAGS_Z);
    }
    
    process.registers[storeg] = mul;
}

// D: DIV [storeg] [reg] [reg]
commands[0xD] = function DIV(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const reg1 = (instruction >>> 8) & 0xFF;
    const reg2 = (instruction) & 0xFF;
    
    // set flags
    process.clearFlags();

    const div = (process.registers[reg1] / process.registers[reg2]) | 0;

    if (div === 0) {
        process.setFlags(FLAGS_Z);
    }

    process.registers[storeg] = div;
}

// E: OR [storeg] [reg] [reg]
commands[0xE] = function OR(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const reg1 = (instruction >>> 8) & 0xFF;
    const reg2 = (instruction) & 0xFF;

    // set flags
    const or = process.registers[reg1] | process.registers[reg2];

    if (or === 0) {
        process.setFlags(FLAGS_Z);
    }
    
    process.registers[storeg] = or;
}

// F: AND [storeg] [reg] [reg]
commands[0xF] = function AND(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const reg1 = (instruction >>> 8) & 0xFF;
    const reg2 = (instruction) & 0xFF;
    
    // set flags
    const and = process.registers[reg1] & process.registers[reg2];
    
    if (and === 0) {
        process.setFlags(FLAGS_Z);
    }
    
    process.registers[storeg] = and;
}

// x10: XOR [storeg] [reg] [reg]
commands[0x10] = function XOR(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const reg1 = (instruction >>> 8) & 0xFF;
    const reg2 = (instruction) & 0xFF;

    // set flags
    const xor = process.registers[reg1] ^ process.registers[reg2];

    if (xor === 0) {
        process.setFlags(xor);
    }
    
    process.registers[storeg] = xor;
}

// x11: LDConst [reg] [const-idx] <unused>
commands[0x11] = function LDConst(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const constidx = (instruction >>> 8) & 0xFF;

    const value = process.consts[constidx] | (process.consts[(constidx + 1) & 0xFF] << 8) | (process.consts[(constidx + 2) & 0xFF] << 16) | (process.consts[(constidx + 3) & 0xFF] << 24);

    process.registers[storeg] = value;
}

// Complex Address Operators.

// This function assumes COMMAND [] [reg] [const] command format.
function getComplexAddress(process, instruction) {
    const reg = (instruction >>> 8) & 0xFF;
    const offset = (instruction) & 0xFF;

    return process.registers[reg] + offset;
}

// x12: Load Effective Address [storeg] [reg] [const]
// take the address given by the value in [reg]
commands[0x12] = function LEA(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const ramAddr = getComplexAddress(process, instruction);

    process.registers[storeg] = ramAddr;
}

// x13: LOAD by effective address [storeg] [reg] [const]
// As in x12, but load the value at that address into [storeg] instead
commands[0x13] = function LOAD_ea(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const ramAddr = getComplexAddress(process, instruction);

    if (ramAddr >= RAM_SIZE) {
        throw new Error("Bus Error");
    }

    process.registers[storeg] = process.ram[ramAddr];
}

// x14: STOre by effective address [readreg] [reg] [const]
// As in x12, but store the value info that address from [readreg] instead
commands[0x14] = function STOre_ea(process, instruction) {
    const readreg = (instruction >>> 16) & 0xFF;
    const ramAddr = getComplexAddress(process, instruction);

    if (ramAddr >= RAM_SIZE) {
        throw new Error("Bus Error");
    }

    process.ram[ramAddr] = process.registers[readreg];
}

// x15: Jump if Zero [reg] [instruction]
commands[0x15] = function JZ(process, instruction) {
    const reg = (instruction >>> 16) & 0xFF;
    
    if (process.registers[reg] === 0) {
        const to_address = instruction & 0xFFFF;
        process.registers[REG_PC] = to_address;
    }
}

// x16 Jump if Non-Zero [reg] [instruction]
commands[0x16] = function JNZ(process, instruction) {
    const reg = (instruction >>> 16) & 0xFF;
    
    if (process.registers[reg] !== 0) {
        const to_address = instruction & 0xFFFF;
        process.registers[REG_PC] = to_address;
    }
}

// x17: Jump if OVerflow flag [] [instruction]
// jump if the last arithmetic operation caused an overflow
commands[0x17] = function JOV(process, instruction) {
    if (process.getFlag(FLAGS_OV)) {
        const to_address = instruction & 0xFFFF;
        process.registers[REG_PC] = to_address;
    }
}


// x18: Jump if Zero Flag [] [instruction]
commands[0x18] = function JZF(process, instruction) {
    if (process.getFlag(FLAGS_Z)) {
        const to_address = instruction & 0xFFFF;
        process.registers[REG_PC] = to_address;
    }
}

// x1A: CoMPare (subtract numbers; set flags without storing value)
// [] [reg1] [reg2]
commands[0x1A] = function CMP(process, instruction) {
    const reg1 = (instruction >>> 8) & 0xFF;
    const reg2 = (instruction) & 0xFF;

    const subtract_unwrapped = process.registers[reg1] - process.registers[reg2];
    const subtract = subtract_unwrapped | 0;

    // set flags
    process.clearFlags();

    if (subtract !== subtract_unwrapped) {
        process.setFlags(FLAGS_OV);
    }

    if (subtract === 0) {
        process.setFlags(FLAGS_Z);
    }
}

// 2 Bit Instructions
//====================

// 6: PUSH [reg]
commands[6] = function PUSH(process, instruction) {
    const reg = (instruction >>> 16) & 0xFF;

    // move stack pointer up
    process.registers[REG_SP] = (process.registers[REG_SP] - 1) & (RAM_SIZE - 1);

    // store
    process.ram[process.registers[REG_SP]] = process.registers[reg];
}

// 7: POP [reg]
commands[7] = function POP(process, instruction) {
    const reg = (instruction >>> 16) & 0xFF;

    // load
    process.registers[reg] = process.ram[process.registers[REG_SP]];

    // move stack pointer down
    process.registers[REG_SP] = (process.registers[REG_SP] + 1) & (RAM_SIZE - 1);
}

// 8: NEG [reg]
// 2's complement
commands[8] = function NEGative(process, instruction) {
    const reg = (instruction >>> 16) & 0xFF;

    // set as negative of the value
    process.registers[reg] = -process.registers[reg];
}

// 9: NOT [reg]
// 1's complement
commands[9] = function NOT(process, instruction) {
    const reg = (instruction >>> 16) & 0xFF;

    // set as 1's complement of the value
    process.registers[reg] = ~process.registers[reg];
}

// x19: sysCALL [call]
commands[0x19] = function sysCALL(process, instruction) {
    const call = (instruction >>> 16) & 0xFF;

    // set as 1's complement of the value
    //process.registers[reg] = ~process.registers[reg];
}


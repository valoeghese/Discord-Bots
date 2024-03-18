let commands = [];
const RAM_SIZE = 4096;

class Process {
    constructor() {
        this.registers = new Uint32Array(4) // 4 registers

        this.stackPointer = RAM_SIZE - 1;
        this.programCounter = 0;
        this.ram = []
        this.consts = [] // limited to 256 bytes
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
    
    process.registers[storeg] = (process.registers[reg1] + process.registers[reg2]) | 0;
}

// B: SUB [storeg] [reg] [reg]
commands[0xB] = function SUB(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const reg1 = (instruction >>> 8) & 0xFF;
    const reg2 = (instruction) & 0xFF;
    
    process.registers[storeg] = (process.registers[reg1] - process.registers[reg2]) | 0;
}

// C: MUL [storeg] [reg] [reg]
commands[0xC] = function MUL(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const reg1 = (instruction >>> 8) & 0xFF;
    const reg2 = (instruction) & 0xFF;
    
    process.registers[storeg] = Math.imul(process.registers[reg1], process.registers[reg2]);
}

// D: DIV [storeg] [reg] [reg]
commands[0xD] = function DIV(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const reg1 = (instruction >>> 8) & 0xFF;
    const reg2 = (instruction) & 0xFF;
    
    process.registers[storeg] = (process.registers[reg1] / process.registers[reg2]) | 0;
}

// E: OR [storeg] [reg] [reg]
commands[0xE] = function OR(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const reg1 = (instruction >>> 8) & 0xFF;
    const reg2 = (instruction) & 0xFF;
    
    process.registers[storeg] = process.registers[reg1] | process.registers[reg2];
}

// F: AND [storeg] [reg] [reg]
commands[0xF] = function AND(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const reg1 = (instruction >>> 8) & 0xFF;
    const reg2 = (instruction) & 0xFF;
    
    process.registers[storeg] = process.registers[reg1] & process.registers[reg2];
}

// x10: XOR [storeg] [reg] [reg]
commands[0x10] = function XOR(process, instruction) {
    const storeg = (instruction >>> 16) & 0xFF;
    const reg1 = (instruction >>> 8) & 0xFF;
    const reg2 = (instruction) & 0xFF;
    
    process.registers[storeg] = process.registers[reg1] ^ process.registers[reg2];
}

// x11: LDConst [reg] [const-idx]

// x12: Load Effective Address [storeg] [reg] [const]
// take the address given by the value in [reg]

// x13: MOV load by address [storeg] [reg] [const]
// As in x12, but load the value at that address into [storeg] instead

// x14: MOV store by address [readreg] [reg] [const]
// As in x12, but store the value info that address from [readreg] instead

// 2 Bit Instructions
//====================

// 6: PUSH [reg]

// 7: POP [reg]

// 8: NEG [reg]
// 2's complement

// 9: NOT [reg]
// 1's complement

// x15: Jump if Zero [reg]

// x16 Jump if Non-Zero [reg]

// x17: Jump if Greater than Zero [reg]
// jump if the value at reg is greater than 0

// x18: Jump if Less than Zero [reg]

// x19: syscall [call]

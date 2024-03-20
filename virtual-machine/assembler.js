function stripLine(line) {
    return line.split(";", 1)[0].trim();
}

/**
 * Takes the assembly program and produces the bytes of the program.
 */
function assemble(assembly) {
    let data_bytes = [];
    let data_instructions = [];

    for (let line of assembly.split("\n")) {
        line = stripLine(line);

        if (line !== "") {
            if (line.startsWith(".section ")) {
                let section = line.substring(".section ".length);

                if (section === "data") {
                    setupDataSection(assembly);
                } else if (section === "bss") {

                } else if (section === "code") {

                }
            } else {
                throw new Error("Only top level statement allowed is .section");
            }
        }
    }
}

/**
 * Iterate 
 */
function parseData() {

}

/**
 * 
 */
function translateInstructions() {

}

function defineBSSAddress() {

}

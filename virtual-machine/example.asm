.section data
  $message "Hello, World!\n"

.section bss
  @allocated db 10  ; allocate 10 bytes as "@allocated" in the ram section immediately after the program

.section code
  ; load the message address and length
  mov A, $message
  mov C, len($message)

  ; invoke the syscall to print the message
  call 0x2  ; print constant

  ; exit the program with exit code 0
  mov A, 0x0
  call 0x1  ; exit

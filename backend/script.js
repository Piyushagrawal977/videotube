import bcrypt from "bcrypt";

const hashOfUndefined = await bcrypt.hash("undefined", 10);
console.log("Hash of 'undefined':", hashOfUndefined);

// hashOfUndefined()
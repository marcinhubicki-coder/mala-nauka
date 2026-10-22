// A provisional edit never mutates or persists the accepted design.
export class EditSession {
 constructor(value){this.original=structuredClone(value);this.value=structuredClone(value);this.past=[];this.future=[];}
 get changed(){return JSON.stringify(this.value)!==JSON.stringify(this.original);}
 update(value){if(JSON.stringify(value)===JSON.stringify(this.value))return false;this.past.push(structuredClone(this.value));this.value=structuredClone(value);this.future=[];return true;}
 undo(){if(!this.past.length)return false;this.future.push(this.value);this.value=this.past.pop();return true;}
 redo(){if(!this.future.length)return false;this.past.push(this.value);this.value=this.future.pop();return true;}
}

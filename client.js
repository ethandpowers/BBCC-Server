import { genKey } from "utils.js";

class Client{
    constructor(socket){
        this.socket = socket;
        this.id = genKey(8);
        this.room = null;
    }
}
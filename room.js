import {genKey} from "utils.js";

class Room{
    constructor(host){
        this.code = genKey(5);
        this.host = host;
        this.players = [];
    }
}
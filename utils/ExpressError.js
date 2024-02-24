// for Error handaling
class ExpressError extends Error {
    constructor(statutsCode, message){
        super();
        this.statutsCode = statutsCode;
        this.message = message;
        console.log(message);
    }
}

module.exports = ExpressError;
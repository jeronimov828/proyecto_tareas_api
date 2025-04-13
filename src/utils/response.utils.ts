export class responseUtils {
    status: boolean;
    list: Array<any>;
    item: any
    message: string;

    constructor(status: boolean, list: Array<any> = [], item: any = null, message: string = "") {
        this.status = status;
        this.list = list;
        this.item = item;
        this.message = message;
    }
}
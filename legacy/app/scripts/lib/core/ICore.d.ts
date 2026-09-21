interface ICommand {
    name: string;
    parameters: IParameter[];
    addParameter(name: string, val: any): ICommand;
    process( name: string, arguments: any): ICommand;
}


interface IParameter {
     name: string;
     value: any;
}

interface IItinerary {
    inCommands: any[];
    outCommands: any[];
        kontext: any;
}

interface IResponseMx {
    cmds: any[];
    resp: any;
    context: any;
    messageList: string[];
    completed: boolean;
    setResponse( response:any , _fwk:any ):void;
    setMessages(): void;
    hasMessages(): boolean;
    getCommand(name: string): any;
    getParameter(commandName:string,paramName:string,unpack?:boolean,hydrate?:boolean): any
    simpleParam(commandName:string,paramName:string): any;
    status():number;
    setKontexts(cmds:any, _fwk:any): void;

}
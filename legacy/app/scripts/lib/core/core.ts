/// <reference path="ICore.d.ts" />


declare var TheUte:any;

// JDH: Consider MxResponse for this and Mx<Something> for the rest of these classes
class ResponseMx implements IResponseMx
{
    cmds: any[];
    resp: any;
    context: any;
    messageList: string[];
    completed: boolean = false;


    constructor( response: any, _fwk:any) {
        if ( response )
        {
            // JDH: Remove unless still useful
            console.info("setting response via constructor ");
            console.info("setting framework pointer _fwk" );
            this.setResponse(response, _fwk);

        }
    }

    setResponse( response:any , _fwk:any ):void {
            // JDH: Remove unless still useful
        console.warn("setResponse() called ");
        console.log(response);

        this.cmds = response.commands;
        this.resp = response;
        this.messageList = [];
        this.setMessages();
        this.setKontexts(this.cmds, _fwk);
        this.completed = true;
    }

    setMessages(): void {
        // JDH: Remove unless still useful
        console.log("messages() called ");

        // JDH: Use for..in
        for(var i =0;i< this.cmds.length; i++)
        {
            var localCommand = this.cmds[i];

            // JDH: Turn special values like Alert and Abend into constants
            if(localCommand.name == "Alert" || localCommand.name == "Abend"){
                this.messageList.push( TheUte().unravel( localCommand.parameters[0].value));
            }
        }
    }

    hasMessages(): boolean {
        // JDH: Use ternary logic
        // return ( this.messageList.length > 0);
        if( this.messageList.length > 0){
            return true;
        }else{
            return false;
        }
    }

    getCommand(name: string): any {
        // JDH: Use for..in
        for(var i =0;i< this.cmds.length; i++)
        {
            var localCommand = this.cmds[i];
            if(localCommand.name == name){
                return localCommand;
            }
        }
        return null;
    }

    getParameter(commandName:string,paramName:string,unpack?:boolean,hydrate?:boolean): any {
       var foundCommand = this.getCommand(commandName);
       var returnObject: any = null;
       // JDH: Use typescripts default parameter support
       if(unpack == undefined) unpack = true;
       if(hydrate == undefined) hydrate = true;
       if( foundCommand != null)
       {
            // JDH: Use for..in
            for(var i =0;i<foundCommand.parameters.length;i++)
            {
                var tmpParam = foundCommand.parameters[i];
                if(tmpParam.name == paramName)
                {
                    if(unpack != undefined && unpack == true){
                        returnObject= TheUte().unravel(tmpParam.value);
                    }
                    else
                    {
                        returnObject= tmpParam.value;
                    }
                }
            }
       }
        else
        {
            //$to do: throw exception somehow ...
            console.warn("Command " + commandName + " not found");
        }

        if( hydrate != undefined && hydrate == true)
        {
            try
            {
                returnObject = JSON.parse(returnObject);
            }
            catch(JPEX)
            {
                console.error(JPEX);
                //$to do: error notification handler ...
                //$to do: remove alert!!
                alert(JPEX.description);
            }
        }
        return returnObject;
    }

    simpleParam(commandName:string,paramName:string): any {
        return this.getParameter(commandName,paramName,true,false);
    }

    status(): number {
        // JDH: Use Abend constant
        var abendCommand = this.getCommand("Abend");
        if( abendCommand != null)
        {
            return 1;   //Failure
        }
        else
        {
            return 0;   //Success
        }
    }


    setKontexts(cmds:any, appContext): void {
        var counter: number = 0;
        var obj = {};

        for(var i =0;i< cmds.length; i++)
        {
            var localCommand = cmds[i];
            // JDH: Use a constant for SetKontext
            if(localCommand.name == "SetKontext"){
                //gather all context objects
                obj[localCommand.parameters[0].name] = localCommand.parameters[0].value;

                //appContext.setContext( localCommand.parameters[0].name , localCommand.parameters[0].value);
                counter++;
            }
        }
        appContext.setContext(obj);

        // JDH: Remove unless still useful
        console.info("set " + counter + " context values ");
    }
}

class Itinerary implements IItinerary{
        inCommands: any[];
        outCommands: any[];
        kontext: any;

    constructor(aKontext?: any)
    {
        this.inCommands = [];
        this.outCommands = [];
        if(!aKontext)
        {
            this.kontext = {};
        }else{
            this.kontext = aKontext;
        }
    }
}



class Parameter implements IParameter {
        name: string;
        value: any;
}

class Command implements ICommand{
    name: string;
    parameters: IParameter[];

    constructor() {
        //initialize macro
        this.parameters = [];
    }

    addParameter(name: string, val: any): ICommand{
        var tmpParameter : Parameter = new Parameter();
        tmpParameter.name = name;
        tmpParameter.value = val;

        this.parameters.push(tmpParameter);
        return this;
    }

     process( name: string, arguments: any): ICommand{
        this.name = name;
        for( var k in arguments )
        {
            var is64: boolean = ( k.indexOf("|64") > -1 );
            this.addParameter(
                is64 ? k.replace("|64","") : k,
                is64 ? TheUte().pack(arguments[k]):arguments[k]
            );
        }
        return this;
    }
}
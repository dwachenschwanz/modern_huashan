angular.module('huashanApp')
    .service('Session', function () {
    return new Session();
});


class Session{
    credentials: string;
    constructor(){}
    create(credentials){
        this.credentials = credentials;
    }
    destroy() {
        this.credentials = null;
    }
    getCredentials(){
        return this.credentials;
    }
}
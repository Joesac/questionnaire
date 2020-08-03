export class User {
    constructor(public idToken: string, public localId: string, public tokenExpirationDate: Date, public refreshToken: string) { }

    get token() {
        if (!this.tokenExpirationDate || this.tokenExpirationDate <= new Date()) {
            return null;
        } else {
            return this.idToken;
        }
    }
}

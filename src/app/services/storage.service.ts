import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { JsonPipe } from '@angular/common';


@Injectable({providedIn: 'root'})
export class StorageService {
    constructor() {}

    saveItem(ref: string, value: any) {
        return Plugins.Storage.set({
            key: ref,
            value: JSON.stringify(value)
        });
    }

    retrieveItem(ref: string) {
        return Plugins.Storage.get({key: ref});
    }
}

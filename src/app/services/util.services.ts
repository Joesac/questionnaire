import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({providedIn: 'root'})
export class UtilService {
    constructor(private alertCtler: AlertController) { }

    showAlertMessage(heading: string, msg: string, btns: string[]) {
        return this.alertCtler.create({
            header: heading,
            message: msg,
            buttons: btns
        }).then(alert => {
            return alert.present();
        });
    }
}

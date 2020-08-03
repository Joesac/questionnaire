import { Component, OnInit, OnDestroy } from '@angular/core';
import { Platform } from '@ionic/angular';

import { Plugins, Capacitor } from '@capacitor/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-thankyou',
  templateUrl: './thankyou.page.html',
  styleUrls: ['./thankyou.page.scss'],
})
export class ThankyouPage implements OnInit, OnDestroy {

  backBtnSubs = new Subscription();

  constructor(
    private platform: Platform
    ) {
    this.backBtnSubs = this.platform.backButton.subscribeWithPriority(
      -1,
      () => {
          Plugins.App.exitApp();
      }
    );
  }

  ngOnInit() {
    setTimeout(() => {
      if (this.platform.is('mobile') && !this.platform.is('hybrid') || this.platform.is('desktop')) {

      } else {
        Plugins.App.exitApp();
      }
    }, 3000);
  }

  ngOnDestroy() {
    if (this.backBtnSubs) {
      this.backBtnSubs.unsubscribe();
    }
  }
}

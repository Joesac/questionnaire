import { Component, OnInit, OnDestroy } from '@angular/core';
import { timer } from 'rxjs';

import { Platform } from '@ionic/angular';
import { Plugins, Capacitor } from '@capacitor/core';
import { Subscription } from 'rxjs';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  showSplash = true;
  autoLoginSubs = new Subscription();
  anonymousLoginSubs = new Subscription();
  splashTimerSubs = new Subscription();

  constructor(
    private platform: Platform,
    private authService: AuthService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      if (Capacitor.isPluginAvailable('SplashScreen')) {
        Plugins.SplashScreen.hide();
        this.splashTimerSubs = timer(10000).subscribe(() => this.showSplash = false);
      }

      if (Capacitor.isPluginAvailable('StatusBar')) {
        Plugins.StatusBar.setBackgroundColor({ color: '#1aa865' });
      }
    });
  }

  ngOnInit() {
    // this.autoLoginSubs = this.authService.autoLogin().subscribe(autoLoginData => {
    //   if (!autoLoginData) {
    //     this.anonymousLoginSubs = this.authService.anonymousSignupLogin().subscribe(asl => {
    //       this.autoLoginSubs = this.authService.autoLogin().subscribe(() => {

    //       });
    //     });
    //   } else {

    //   }
    // });
  }

  ngOnDestroy() {
    if (this.autoLoginSubs) {
      this.autoLoginSubs.unsubscribe();
    }

    if (this.anonymousLoginSubs) {
      this.anonymousLoginSubs.unsubscribe();
    }

    if (this.splashTimerSubs) {
      this.splashTimerSubs.unsubscribe();
    }
  }
}

import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { IonSlides, ToastController, Platform, IonRouterOutlet } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Plugins } from '@capacitor/core';

import { StorageService } from '../services/storage.service';

export interface IUserInfo {
  age: string;
  gender: string;
}

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.page.html',
  styleUrls: ['./user-info.page.scss'],
})
export class UserInfoPage implements OnInit, OnDestroy {
  @ViewChild('slidesContainer', { static: false }) slides: IonSlides;

  selectedAge = '';
  selectedGender = '';
  ageGroups = [
    { age: '16 - 19' },
    { age: '20 - 24' },
    { age: '25 - 34' },
    { age: '35 - 44' },
    { age: '55 - 64' },
    { age: '65+' }
  ];
  gender = [{ desc: 'Male' }, { desc: 'Female' }];
  slideOpts = { initialSlide: 0, speed: 400 };

  selectedSlide: IonSlides;
  backBtnSubs = new Subscription();

  constructor(
    private storageService: StorageService,
    private router: Router,
    private toastController: ToastController,
    private platform: Platform,
    private ionRouterOutlet: IonRouterOutlet
  ) {
    this.backBtnSubs = this.platform.backButton.subscribeWithPriority(
      -1,
      () => {
        // if (!this.ionRouterOutlet.canGoBack()) {
          Plugins.App.exitApp();
        // }
      }
    );
  }

  ngOnInit() {
    this.storageService.retrieveItem('userInfo').then((v) => {
      if (v.value) {
        this.router.navigateByUrl('/departments');
        return;
      }
    });
  }

  onSlideToNext() {
    if (!this.selectedSlide) {
      this.selectedSlide = this.slides;
    }
    this.selectedSlide.slideNext();
  }

  onIonSlideChange(slides) {
    this.selectedSlide = slides;
  }

  onComplePersonalInfo() {
    const userData = {} as IUserInfo;
    userData.age = this.selectedAge;
    userData.gender = this.selectedGender;
    if (!userData.age.length || !userData.gender.length) {
      this.toastController.create(
        {duration: 2000, message: 'Please select your age and gender'}
      ).then(toastEl => {
        toastEl.present();
      });
      return;
    }
    this.storageService.saveItem('userInfo', userData).then(v => {
      this.router.navigateByUrl('/departments');
    });
  }

  ngOnDestroy() {
    if (this.backBtnSubs) {
      this.backBtnSubs.unsubscribe();
    }
  }
}

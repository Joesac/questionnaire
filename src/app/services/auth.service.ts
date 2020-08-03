import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, from, Subscription } from 'rxjs';
import { map, tap, switchMap, take } from 'rxjs/operators';
import { Plugins } from '@capacitor/core';

import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

interface AuthReturnedData {
  idToken: string;
  kind: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

interface AuthRefreshedTokenReturnedData {
  expires_in: string;
  id_token: string;
  refresh_token: string;
  user_id: string;
}

export enum refreshTokenErrorCodes {
  'TOKEN_EXPIRED',
  'USER_DISABLED',
  'USER_NOT_FOUND',
  'INVALID_REFRESH_TOKEN',
  'INVALID_GRANT_TYPE',
  'MISSING_REFRESH_TOKEN'
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private userIsAuthenticated: false;
  private _user = new BehaviorSubject<User>(null);

  private activeRefreshTokenTimer: any;

  private autoLoginSubs = new Subscription();
  private anonymousSignupLoginSubs = new Subscription();

  constructor(private httpClient: HttpClient) { }

  get UserIsAuthenticated() {
    return this._user.asObservable().pipe(
      map((user) => {
        if (user) {
          return !!user.token;
        } else {
          return null;
        }
      })
    );
  }

  get token() {
    return this._user.asObservable().pipe(
      map((user) => {
        if (user) {
          return user.idToken;
        } else {
          return null;
        }
      })
    );
  }

  get refreshtoken() {
    return this._user.asObservable().pipe(
      map((user) => {
        if (user) {
          return user.refreshToken;
        } else {
          return null;
        }
      })
    );
  }

  anonymousSignupLogin() {
    return this.httpClient
      .post<AuthReturnedData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.API_KEY}`,
        { returnSecureToken: true }
      )
      .pipe(
        take(1),
        tap((userData) => {
          const expirationTIme = new Date(
            new Date().getTime() + +userData.expiresIn * 1000
          );
          this.storeAuthData(
            userData.idToken,
            expirationTIme.toISOString(),
            userData.localId,
            userData.refreshToken
          );
          this.getRefreshUserToken();
        })
      );
  }

  private storeAuthData(
    idToken: string,
    expirationDate: string,
    localId: string,
    refreshToken: string
  ) {
    const authData = JSON.stringify({
      idToken: idToken,
      localId: localId,
      expirationDate: expirationDate,
      refreshToken: refreshToken,
    });
    Plugins.Storage.set({ key: 'authData', value: authData });
  }

  autoLogin() {
    return from(Plugins.Storage.get({ key: 'authData' })).pipe(
      take(1),
      map((storedData) => {
        if (!storedData || !storedData.value) {
          return null;
        }

        const parsedData = JSON.parse(storedData.value) as {
          refreshToken: string;
          idToken: string;
          expirationDate: string;
          localId: string;
        };
        const expirationTime = new Date(parsedData.expirationDate);
        if (expirationTime <= new Date()) {
          return null;
        }

        const user = new User(
          parsedData.idToken,
          parsedData.localId,
          expirationTime,
          parsedData.refreshToken
        );
        return user;
      }),
      tap((user) => {
        if (user) {
          this._user.next(user);
          this.getRefreshUserToken();
        }
      }),
      map((user) => {
        return user;
      })
    );
  }

  getRefreshUserToken(refreshTime: number = 600000) { // 600000 is 10 minutes
    if (this.activeRefreshTokenTimer) {
      clearTimeout(this.activeRefreshTokenTimer);
    }

    this.activeRefreshTokenTimer = setInterval(() => {
      this.refreshtoken.pipe(
        take(1),
        switchMap((t) => {
          return this.httpClient.post<AuthRefreshedTokenReturnedData>(
            `https://securetoken.googleapis.com/v1/token?key=${environment.API_KEY}`,
            { grant_type: 'refresh_token', refresh_token: t }
          );
        }),
        take(1),
        tap((refreshedTokenData) => {
          const expirationTIme = new Date(
            new Date().getTime() + +refreshedTokenData.expires_in * 1000
          );
          this.storeAuthData(
            refreshedTokenData.id_token,
            expirationTIme.toISOString(),
            refreshedTokenData.user_id,
            refreshedTokenData.refresh_token
          );
        })
      ).subscribe(() => { }, err => {
        if (err.message === refreshTokenErrorCodes.TOKEN_EXPIRED) {
          this.anonymousSignupLoginSubs = this.anonymousSignupLogin().subscribe(() => { }, aErr => { });
        } else {
          this.autoLoginSubs = this.autoLogin().subscribe(() => { }, alErr => { });
        }
      });
    }, refreshTime);
  }

  ngOnDestroy() {
    this._user.next(null);
    if (this.activeRefreshTokenTimer) {
      clearTimeout(this.activeRefreshTokenTimer);
    }

    if (this.anonymousSignupLoginSubs) {
      this.anonymousSignupLoginSubs.unsubscribe();
    }

    if (this.autoLoginSubs) {
      this.autoLoginSubs.unsubscribe();
    }
  }
}

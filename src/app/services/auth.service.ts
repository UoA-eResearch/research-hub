import {Inject, Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import {Subject} from 'rxjs/Subject';
import {User} from '../model/User';
import {HttpClient} from '@angular/common/http';
import {DOCUMENT} from '@angular/common';


@Injectable()
export class AuthService {

  public user: User;
  private session: any;
  private isLoggedInVal = false;
  public loginChange: Subject<any> = new Subject<any>();

  constructor(private http: HttpClient, @Inject(DOCUMENT) private document: Document) {
    this.loginChange.next(false);

    // Check if user is logged in after app loads
    const sessionSub = this.getSession().subscribe((session) => {
      sessionSub.unsubscribe();
    });
  }

  login() {
    window.location.href = 'login.html?redirectTo=' + encodeURI(this.document.location.href);
  }

  isLoggedIn(): boolean {
    return this.isLoggedInVal;
  }

  private updateSession(session: any) {
    this.isLoggedInVal = Object.getOwnPropertyNames(session).length !== 0; // Checks if session object empty or not
    // If empty then not logged in
    if (this.isLoggedInVal) {
      this.user = User.fromSession(session);
    } else {
      this.user = undefined;
    }

    this.session = session;
    this.loginChange.next(this.isLoggedInVal);
  }

  public getSession() {
    const headers = {'Accept': 'application/json'};
    return this.http
      .get(environment.shibbolethSessionUrl, {headers})
      .map((session) =>  {
        this.updateSession(session);
        return this.isLoggedInVal;
      });
  }
}
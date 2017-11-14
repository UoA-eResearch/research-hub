import {Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import {Subject} from 'rxjs/Subject';
import {User} from '../model/User';
import {HttpClient} from '@angular/common/http';


@Injectable()
export class AuthService {

  public user: User;
  private session: any;
  private loggedIn = false;
  private loginPopup: any;
  public loginChange: Subject<any> = new Subject<any>();

  constructor(private http: HttpClient) {
    this.loginChange.next(false);
    this.getSession().subscribe((session) => {
        this.updateSession(session);
    });
  }

  login() {
    this.loginPopup = window.open('login.html', 'popup', 'width=600,height=600');
    this.loginPopup.onbeforeunload = () => {
      this.loginChange.next(this.loggedIn);
      this.getSession().subscribe((session) => {
        this.updateSession(session);
      });
    };
  }

  isLoggedIn() {
    return this.loggedIn;
  }

  private updateSession(session: any) {
    this.loggedIn = Object.getOwnPropertyNames(session).length !== 0; // Checks if session object empty or not
    // If empty then not logged in
    if (this.loggedIn) {
      this.user = User.fromSession(session);
    } else {
      this.user = undefined;
    }

    this.session = session;
    this.loginChange.next(this.loggedIn);
  }

  public getSession() {
    const headers = {'Accept': 'application/json'};
    return this.http
      .get(environment.shibbolethSessionUrl, {headers})
      .map((response) => response);
  }
}

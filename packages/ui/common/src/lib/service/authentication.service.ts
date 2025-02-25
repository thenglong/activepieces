import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import {
  AuthenticationResponse,
  SignInRequest,
  SignUpRequest,
  User,
} from '@activepieces/shared';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  public currentUserSubject: BehaviorSubject<User | undefined> =
    new BehaviorSubject<User | undefined>(this.currentUser);
  private jwtHelper = new JwtHelperService();
  constructor(private router: Router, private http: HttpClient) {}

  get currentUser(): User {
    return JSON.parse(
      localStorage.getItem(environment.userPropertyNameInLocalStorage) || '{}'
    );
  }

  me(): Observable<User> {
    return this.http.get<User>(environment.apiUrl + '/users/me');
  }

  signIn(request: SignInRequest): Observable<HttpResponse<User>> {
    return this.http.post<User>(
      environment.apiUrl + '/authentication/sign-in',
      request,
      {
        observe: 'response',
      }
    );
  }

  signUp(
    request: SignUpRequest
  ): Observable<HttpResponse<AuthenticationResponse>> {
    return this.http.post<AuthenticationResponse>(
      environment.apiUrl + '/authentication/sign-up',
      request,
      {
        observe: 'response',
      }
    );
  }

  saveToken(token: string) {
    localStorage.setItem(environment.jwtTokenName, token);
  }

  saveUser(response: HttpResponse<any>) {
    this.saveToken(response.body.token);
    this.updateUser(response.body);
  }

  updateUser(user: User) {
    localStorage.setItem(
      environment.userPropertyNameInLocalStorage,
      JSON.stringify(user)
    );
    this.currentUserSubject.next(user);
  }

  isLoggedIn() {
    let jwtToken: any = localStorage.getItem(environment.jwtTokenName);
    if (jwtToken == null) {
      jwtToken = undefined;
    }
    try {
      if (jwtToken && this.jwtHelper.isTokenExpired(jwtToken)) {
        this.logout();
        return false;
      }
    } catch (exception_var) {
      this.logout();
      return false;
    }
    return localStorage.getItem(environment.jwtTokenName) != null;
  }

  logout(): void {
    localStorage.removeItem(environment.jwtTokenName);
    localStorage.removeItem(environment.userPropertyNameInLocalStorage);
    this.currentUserSubject.next(undefined);
    this.router.navigate(['sign-in']);
  }

  // TODO - move to a separate service
  saveNewsLetterSubscriber(email: string) {
    return this.http.post(
      'https://us-central1-activepieces-b3803.cloudfunctions.net/addContact',
      { email: email }
    );
  }
  getDecodedToken(): Record<string, string> | null {
    const token = localStorage.getItem(environment.jwtTokenName);
    return this.jwtHelper.decodeToken(token || '');
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:8080/api/test/';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};
@Injectable({
  providedIn: 'root',
})

export class UserService {
  constructor(private http: HttpClient) {}

  getPublicContent(): Observable<any> {
    return this.http.get(API_URL + 'all', { responseType: 'text' });
  }

  getUserBoard(): Observable<any> {
    return this.http.get(API_URL + 'user', { responseType: 'text' });
  }

  insertScore(username: string, state: string): Observable<any> {
    return this.http.post(
      API_URL + 'savescore',
      {
        username,
        state
      },
      httpOptions
    );
  }


  
  showScore(username: string): Observable<any> {
    return this.http.post(
      API_URL + 'showscore',
      {
        username,
      },
      httpOptions
    );
  }
}

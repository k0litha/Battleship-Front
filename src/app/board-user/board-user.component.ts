import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../_services/user.service';
import { FormBuilder } from '@angular/forms';
import { StorageService } from '../_services/storage.service';
import { AuthService } from '../_services/auth.service';
@Component({
  selector: 'app-board-user',
  templateUrl: './board-user.component.html',
  styleUrls: ['./board-user.component.css']
})
export class BoardUserComponent implements OnInit {
  content?: string;
  createForm = this.formBuilder.group({
    roomCreate: '',
  });
  joinForm = this.formBuilder.group({
    roomJoin: '',
  });

  constructor(private userService: UserService,
    private formBuilder: FormBuilder,
    private router: Router,
    private storageService: StorageService) { }
    isLoggedIn = false;
    username?: string;
    onSubmitCreate() {
      this.router.navigate(['game'], { state: this.createForm.value})
    }
  
    onSubmitJoin() {
      this.router.navigate(['game'], { state: this.joinForm.value})
    }
    
  ngOnInit(): void {

    this.isLoggedIn = this.storageService.isLoggedIn();
  
      if (this.isLoggedIn) {
        const user = this.storageService.getUser();
        this.username = user.username;
        console.log(this.username)
      }else{
        window.location.replace('http://localhost:8081');
      }
    this.userService.getUserBoard().subscribe({
      next: data => {
        this.content = data;
      },
      error: err => {
        if (err.error) {
          try {
            const res = JSON.parse(err.error);
            this.content = res.message;
          } catch {
            this.content = `Error with status: ${err.status} - ${err.statusText}`;
          }
        } else {
          this.content = `Error with status: ${err.status}`;
        }
      }
    });
  }

}

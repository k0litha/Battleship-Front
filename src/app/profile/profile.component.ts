import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { StorageService } from '../_services/storage.service';
import { UserService } from '../_services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: any;
  allScores: any = [];
  dtOptions:DataTables.Settings={}
  dtTrigger:Subject<any>=new Subject<any>()
  constructor(private storageService: StorageService,
    private userService: UserService) { }

  ngOnInit(): void {
    this.dtOptions={
      pagingType:'full_numbers',
      lengthMenu: [5, 10, 25, 50, 75, 100 ]
    }
    this.currentUser = this.storageService.getUser();
    this.LoadScores();

  }

  dateConvert(date: string | number | Date) {
    return new Date(date).toLocaleDateString();
  }
  timeConvert(date: string | number | Date) {
    return new Date(date).toLocaleTimeString();
  }

  LoadScores(): void {
    this.userService.showScore(this.currentUser.username).subscribe({
      next: data => {  
        this.allScores=data.score;
        this.dtTrigger.next(null)
        console.log(this.allScores)
      },
      error: err => {
        console.log(err);
      }
    });
  }
}

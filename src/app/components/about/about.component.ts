import {Component} from '@angular/core';
import {ApiService} from 'app/services/api.service';


@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {

  theDirectorUrl = this.apiService.getAssetUrl('page-elements/mark.jpg');

  constructor(private apiService: ApiService) {

  }
}

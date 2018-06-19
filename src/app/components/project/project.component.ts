import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {CerApiService} from '../../services/cer-api.service';
import {Project, Member} from '../../model/Project';
import {Resource, AccessLevel, FileShare, Vm} from '../../model/Resource';
import {Observable} from 'rxjs/Observable';
import {isUndefined} from "util";

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit, OnDestroy {

  showContent = false;

  private routeParamsSub: any;

  /**
   * Project Variables
   */
  projectId: string; // Loaded from route subscription

  projectResources: string[];

  projectResources2: Resource[] = [];

  project: Project = {
    id: '',
    title: '',
    code: ''
  };

  newUserUoaId: number;

  resourceAccessNotice: string; // String representing resource access change notices

  constructor(private cerApiService: CerApiService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.routeParamsSub = this.route.params.subscribe(params => {
      this.projectId = params['projectId'];
    });

    this.getProjectDetails(this.projectId);
  }

  // Two resources manually instantiated. *ToDo: iterate over the array passed to this method in future
  getResourceDetails(projectResourcesString: string[]) {

    const vmResource: Vm = new Vm();
    vmResource.name = 'Virtual Machine';
    vmResource.id = 15785;

    const fileShareResource: FileShare = new FileShare();
    fileShareResource.name = 'File Share';
    fileShareResource.id = 42864;

    this.projectResources2.push(vmResource);
    this.projectResources2.push(fileShareResource);

    // console.log(this.projectResources2);
  }

  getProjectDetails(projectId: string) {

    // Hardcoded call
    this.cerApiService.getProjectDetailsHardcoded(projectId).subscribe(response => {
        this.projectResources = response.projectResources;
    });

    // Get Project Details
    this.cerApiService.getProjectDetails(projectId).subscribe((response: Project) => {
      // console.log('CeR API Returned: ', response);
      this.project.id = response.id;
      this.project.title = response.title;
      this.project.description = response.description;
      this.project.code = response.code;
      this.project.members = response.members;

      // Get Grouper Details
      // this.cerApiService.getProjectResources(this.project.code, 'vmuser');

      // Setup initial resource objects
      this.getResourceDetails(this.projectResources);

      for (const resource of this.projectResources2) {
        for (let accessLevel of resource.accessLevels) {
         this.cerApiService.getProjectResources(this.project.code, accessLevel.grouperGroupId).subscribe(res =>  accessLevel.users = res);
        }
      }

      // console.log('Finished project2: ', this.projectResources2);

      this.showContent = true;
    });

  }

  /**
   * Get a users access level name for a particular resource
   * @param {number} uoaId
   * @param {Resource} resource
   */
  getUserResourceAccessLevel(uoaId: number, resource: Resource) {
     for (const accessLevel of resource.accessLevels) {
       if (accessLevel.users.indexOf(uoaId) !== -1) {
         return accessLevel;
       }
     }
     return 'No Access';
  }

  /**
   * Update a project members resource access group
   */
  updateProjectResourceGroupAccess(accessLevel: AccessLevel, projectMember: Member, resource: Resource) {

    // Remove user from any existing groups from the resource
    if (this.getUserResourceAccessLevel(projectMember.uoaId, resource) !== 'No Access') {
      this.cerApiService.
        deleteProjectResourceGroupAccess( this.project.code,
                                          (<AccessLevel>this.getUserResourceAccessLevel(projectMember.uoaId, resource)).grouperGroupId,
                                          projectMember.uoaId).subscribe();
    }

    this.cerApiService.updateProjectResourceGroupAccess(this.project.code, accessLevel.grouperGroupId, projectMember.uoaId).subscribe(response => {
      console.log('Grouper response to add user request: ', response);
      this.resourceAccessNotice = '<h3>Success!</h3>' + projectMember.fullName + ' (<span class="infoText">' + projectMember.uoaId +
                                  '</span>) added to the ' + resource.name + ' (<span class="infoText">' +  resource.id +
                                  '</span>) group ' + accessLevel.name + ' (<span class="infoText">' + accessLevel.grouperGroupId +
                                  '</span>)<br />Changes to the ' + resource.name + ' may take a few minutes to take effect';
    });
  }

  /**
   * Remove a project members access to a resource group
   */
  deleteProjectResourceGroupAccess(accessLevel: AccessLevel, projectMember: Member, resource: Resource) {

    this.cerApiService.deleteProjectResourceGroupAccess(this.project.code, accessLevel.grouperGroupId, projectMember.uoaId).subscribe(response => {
      console.log('Grouper response to delete user request: ', response);
      this.resourceAccessNotice = '<h3>Success!</h3>' + projectMember.fullName + ' (<span class="infoText">' + projectMember.uoaId +
                                  '</span>) removed from the ' + resource.name + ' (<span class="infoText">' +  resource.id +
                                  '</span>) group ' + accessLevel.name + ' (<span class="infoText">' + accessLevel.grouperGroupId +
                                  '</span>)<br />Changes to the ' + resource.name + ' may take a few minutes to take effect';
    });
  }


  addProjectMember() {
    this.cerApiService.addProjectMember(this.newUserUoaId, this.project.id);
  }

  ngOnDestroy() {
    this.routeParamsSub.unsubscribe();
  }

}

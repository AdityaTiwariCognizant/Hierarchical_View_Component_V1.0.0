import { LightningElement,wire,api,track } from 'lwc';
import getChildRecords from '@salesforce/apex/hierarchicalViewController.getRelatedChildRecords';
import { getRelatedListsInfo } from "lightning/uiRelatedListApi";
import {NavigationMixin} from 'lightning/navigation';


export default class RecordListItemView extends NavigationMixin(LightningElement) {


    @api recordid; 
    @api parentid
    @api parentobjectapiname;
    @api childobjectapiname;
    @track childRecords=[];
    @track viewChildRecords = [];
    relatedLists;
    @track relatedListOptions;
    recordClicked = false;

    @track requireViewAll=false;


@wire(getChildRecords,{recordId:'$recordid',parentObjectApiName:'$parentobjectapiname',childObjectApiName:'$childobjectapiname'})
    wiredChildRecord({error,data}){
        if(data){
            this.childRecords = data;
            this.viewChildRecords = this.childRecords.slice(0,4)
            console.log('Child records :'+JSON.stringify(data));
            // console.log('**Parent Api Name '+this.parentobjectapiname);
            // console.log('**Parent recordId '+this.recordid);
            // console.log('**Child Api Name '+this.childobjectapiname);
            if(this.childRecords.length>4){
                this.requireViewAll = true
            }
            console.log('child Record size '+this.childRecords.length);
        }
        else if (error){
        console.error(error);
        console.log(error);
    }
}

handleRecordSelection(event){

    

    this.recordClicked=true;
    const clickedId = event.currentTarget.dataset.id; // Extract ID from data attribute
    console.log('Clicked ID:', clickedId);

    this.selectedRecord = this.childRecords.find(record => record.id === clickedId);
    console.log('$$$ '+JSON.stringify(this.selectedRecord));

    const evt = new CustomEvent('recordselection', {
        detail: { id: event.currentTarget.dataset.id
                  
         }
    });
    this.dispatchEvent(evt);


}
handleRecordCollapse(event){
    this.recordClicked=false;
    this.selectedRecord = {
        name:'',
        id:'',
        email:''

    }

    const evt = new CustomEvent('recordcollapse', {
        detail: { id:'' }
    });
    this.dispatchEvent(evt);
}

@wire(getRelatedListsInfo, { parentObjectApiName: '$childobjectapiname'})
wiredRelatedLists({ error, data }) {
    if (data) {
        //console.log('Related Lists Data:', data);
        this.relatedLists = data.relatedLists; // Store the related lists data
        //console.log('Related List :'+this.relatedLists);
    

        this.relatedListOptions = this.relatedLists.map(item => ({
            label: item.entityLabel,
            value: item.entityLabel, // Use entityLabel as the value
            iconUrl: item.themeInfo.iconUrl,
            color: '#'+item.themeInfo.color,
            isVisible:false
        }));
        console.log('Related list options :'+JSON.stringify(this.relatedListOptions));

    } else if (error) {
        console.error('Error fetching related lists:', error);
    }
}

findRelationShipName(childObjApiName){
    const postfix = childObjApiName.slice(-2)
    if(postfix == '_c'){
        console.log(childObjApiName+'__r');
        return childObjApiName+'__r';
    }
    else{
        console.log(childObjApiName+'s');
        return childObjApiName+'s';
    }
}

handleViewAll(evt){
    console.log('recordid '+this.recordid);
    console.log('parent object api name '+this.parentobjectapiname);
    console.log('relationship name '+this.findRelationShipName(this.childobjectapiname));

    this[NavigationMixin.Navigate]({
        type: 'standard__recordRelationshipPage',
        attributes: {
            recordId: this.recordid,  // The parent record ID
            objectApiName:this.parentobjectapiname,
            relationshipApiName: this.findRelationShipName(this.childobjectapiname),  // The dynamic relationship name
            actionName: 'view'  // View the related list
        }
        
    });
    

    

}


}
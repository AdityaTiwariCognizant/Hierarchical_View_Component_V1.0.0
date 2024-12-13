import { LightningElement,wire,api,track } from 'lwc';
import getChildRecords from '@salesforce/apex/hierarchicalViewController.getRelatedChildRecords';
import { getRelatedListsInfo } from "lightning/uiRelatedListApi";
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getRecord } from 'lightning/uiRecordApi';


import {NavigationMixin} from 'lightning/navigation';

const FIELD_CRITERIA = ['Name', 'Number', 'Type', 'Date','Status', 'Priority',  'Amount', 'Phone'];

export default class RecordListItemView extends NavigationMixin(LightningElement) {

    @api recordid; 
    
    @api parentobjectapiname;
    @api childobjectapiname;
    @track childRecords=[];
    @track viewChildRecords = [];
    relatedLists;
    @track relatedListOptions;
    recordClicked = false;

    selectedRecordId;

    @track filteredFields = [];

    @track requireViewAll=false;

    @track displayObject;

    @track displayObjectKeys = [];

    @track openedObjectRecordId;


@wire(getChildRecords,{recordId:'$recordid',parentObjectApiName:'$parentobjectapiname',childObjectApiName:'$childobjectapiname'})
    wiredChildRecord({error,data}){
        if(data){
            this.childRecords = data;
            this.viewChildRecords = this.childRecords.slice(0,4)
            //console.log('Child records :'+JSON.stringify(data));
            // console.log('**Parent Api Name '+this.parentobjectapiname);
            // console.log('**Parent recordId '+this.recordid);
            // console.log('**Child Api Name '+this.childobjectapiname);
            if(this.childRecords.length>4){
                this.requireViewAll = true
            }

            this.openedObjectRecordId = this.viewChildRecords[0].id;
            console.log('### '+this.openedObjectRecordId);

            console.log('child Record structure $$$### '+JSON.stringify(this.childRecords));
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

    this.selectedRecordId = this.selectedRecord.id;


    const evt = new CustomEvent('recordselection', {
        detail: { id: event.currentTarget.dataset.id,

                  
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
        // console.log('Related list options :'+JSON.stringify(this.relatedListOptions));

    } else if (error) {
        console.error('Error fetching related lists:', error);
    }
}

findRelationShipName(childObjApiName){
    const postfix = childObjApiName.slice(-2)
    if(postfix == '_c'){
        console.log('Child Relationship name :'+childObjApiName+'__r');
        return childObjApiName+'__r';
    }
    else{
        console.log('Child Relationship name :'+childObjApiName+'s');
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

@wire(getRecord, { recordId: '$openedObjectRecordId', layoutTypes: ['Compact'] })
wiredRecord({ error, data }) {
    if (data) {
        this.recordData = data.fields; // Get field data
        //console.log('DATA FIELDS '+JSON.stringify(this.recordData));

        console.log('DISPLAY FIELDS '+JSON.stringify(this.filterAndModifyObject(this.recordData)));
        this.displayObject = this.filterAndModifyObject(this.recordData);

        this.displayObjectKeys = Object.keys(this.displayObject).filter(key => {
            // Only keep the fields that have 'displayValue' and 'value' properties
            return this.displayObject[key]?.displayValue !== undefined && this.displayObject[key]?.value !== undefined;
        });
        console.log('DISPLAY OBJ KEYS '+JSON.stringify(this.displayObjectKeys));


    } else if (error) { 
        console.error('Error retrieving record:', error);
    }
}

// Filter and determine the fields to display

filterAndModifyObject(inputObject) {
    // Step 1: Separate keys with 'name' or 'number' and those that don't
    let alwaysIncluded = {};
    let filteredObject = {};

    // Step 2: Separate keys based on whether they contain 'name' or 'number'
    Object.keys(inputObject).forEach((key) => {
        const value = inputObject[key];

        // Always include keys that contain 'name' or 'number' in the key, regardless of displayValue
        if (key.toLowerCase().includes('name') || key.toLowerCase().includes('number')) {
            alwaysIncluded[key] = value;
        } 
        // For other keys, include them only if displayValue is not null
        else if (value && value.displayValue !== null && value.displayValue !== '') {
            filteredObject[key] = value;
        }
    });

    // Step 3: Combine alwaysIncluded with the rest of the filteredObject
    const displayObject = { ...alwaysIncluded, ...filteredObject };

    // Step 4: Sort the keys by the size of their value's displayValue (if present), else by the size of the value field
    const sortedKeys = Object.keys(displayObject)
        .sort((a, b) => {
            const valueA = displayObject[a];
            const valueB = displayObject[b];

            // Length of the displayValue or the value if displayValue is null
            const lengthA = valueA.displayValue ? valueA.displayValue.length : (valueA.value ? valueA.value.toString().length : 0);
            const lengthB = valueB.displayValue ? valueB.displayValue.length : (valueB.value ? valueB.value.toString().length : 0);

            return lengthA - lengthB;  // Sort by increasing length
        });

    return displayObject;
}

getUniqueRecords(records) {
    const uniqueRecords = [];
    const recordIds = new Set();

    records.forEach(record => {
        if (!recordIds.has(record.id)) {
            recordIds.add(record.id);
            uniqueRecords.push(record);
        }
    });

    return uniqueRecords;
}

get filteredDisplayObjectKeys() {
    return [...new Set(this.displayObjectKeys)].slice(0, 4); // Ensure unique keys and limit to 4
}

// New computed property to get all record values based on filtered keys
displayRecordValues() {
    return this.viewChildRecords.map(record => {
        return this.filteredDisplayObjectKeys.map(key => {
            const propertyKey = key.toLowerCase(); // Convert to lowercase
            return {
                key: key,
                value: this.viewChildRecords[propertyKey] || '' // Access the property dynamically
            };
        });
    });
}

get filteredDisplayObjectKeys() {
    return [...new Set(this.displayObjectKeys)].slice(0, 4);
}

get filteredRecords() {
    return this.viewChildRecords.map(record => {
        return this.filteredDisplayObjectKeys.map(key => {
            return {
                key: key,
                value: record[key.toLowerCase()] || '' // Dynamically access record properties
            };
        });
    });
}

get filteredRecords() {
    return this.viewChildRecords.map((record) => {
        return {
            id: record.id, // Add the record ID here for unique identification
            values: this.filteredDisplayObjectKeys.map((key) => {
                return {
                    key: key,
                    value: record[key.toLowerCase()] || '' // Dynamically access record properties
                };
            })
        };
    });
}


}
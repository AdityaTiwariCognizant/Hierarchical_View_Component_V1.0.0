import { LightningElement,wire,api,track } from 'lwc';
import getChildRecords from '@salesforce/apex/hierarchicalViewController.getRelatedChildRecords';
import { getRelatedListsInfo } from "lightning/uiRelatedListApi";
import { getRecord } from 'lightning/uiRecordApi';


import {NavigationMixin} from 'lightning/navigation';

const FIELD_CRITERIA = [ 'Time','Title','Date','Account', 'Type', ,'Status', 'Priority',  'Amount', 'Phone'];

export default class RecordListItemView extends NavigationMixin(LightningElement) {

    @api recordid; 
    @api flexipageRegionWidth;
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

    @track showNoDataCard = false;

    @track isLoading = true;



@wire(getChildRecords,{recordId:'$recordid',parentObjectApiName:'$parentobjectapiname',childObjectApiName:'$childobjectapiname'})
    wiredChildRecord({error,data}){
        if(data){
            if (Array.isArray(data) && data.length > 0) {
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
        else {
            console.log('No related records found');
            this.relatedRecords = [];
            this.showNoDataCard = true;
            this.recordClicked = false;
        }
        setTimeout(() => {
            this.isLoading = false;
        }, 400);
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
    this.selectedRecordId = clickedId;
    this.selectedRecord = this.childRecords.find(record => record.id === clickedId);
    console.log('$$$ '+JSON.stringify(this.selectedRecord));

    this.processSelectedRecordFields();

    const evt = new CustomEvent('recordselection', {
        detail: { id: event.currentTarget.dataset.id,
            name : this.selectedRecord.name 

                  
         }
    });
    this.dispatchEvent(evt);


}

processSelectedRecordFields() {
    if (this.selectedRecord) {
        const selectedFields = {};

        // Iterate over filteredDisplayObjectKeys and find corresponding data in selectedRecord
        this.filteredDisplayObjectKeys.forEach(key => {
            // Match the field name (key) in selectedRecord and store its value
            const recordKey = key.toLowerCase(); // Convert key to lowercase to match the field names in selectedRecord
            if (this.selectedRecord[recordKey]) {
                selectedFields[key] = this.selectedRecord[recordKey]; // Add it to selectedFields
            } else {
                selectedFields[key] = '--'; // If not found, set a placeholder value
            }
        });

        // Store the selected fields in selectedRecordFields
        this.selectedRecordFields = selectedFields;
    }
}

handleRecordNavigation(event) {
    const clickedRecordId = event.currentTarget.dataset.id;

    this[NavigationMixin.Navigate]({
        type: 'standard__recordPage',
        attributes: {
            recordId: this.selectedRecordId,  // The record ID to navigate to
            objectApiName: this.selectedRecord.name,  // The object API name (e.g., 'Account', 'Contact')
            actionName: 'view'  // Use 'view' to view the record page
        }
    });
}

handleRecordCollapse(event){
    this.recordClicked=false;
    this.selectedRecord = null;
    this.selectedRecordFields = {}; 

    const evt = new CustomEvent('recordcollapse', {
        detail: { id:'', name :'' }
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

        // Check if the key matches any of the criteria in FIELD_CRITERIA (case insensitive match)
        const matchesCriteria = FIELD_CRITERIA.some(criteria => 
            key.toLowerCase().includes(criteria.toLowerCase())
        );

        // If the key matches any of the FIELD_CRITERIA criteria, include it in filteredObject
        if (matchesCriteria && value && value.displayValue !== null && value.displayValue !== '') {
            filteredObject[key] = value;
        }

        // Always include keys that contain 'name' or 'number' in the key, regardless of displayValue
        else if (key.toLowerCase().includes('name') || key.toLowerCase().includes('number')) {
            alwaysIncluded[key] = value;
        }

        // Handle accountid dynamically based on the presence of 'account' in the field name
        

        // Exclude the ownerid field explicitly
        else if (key.toLowerCase().includes('ownerid')) {
            // Don't add anything to filteredObject for ownerid
        }
        // For other fields, include them only if displayValue is not null
         else if (value.value!=='') {
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
    return [...new Set(this.displayObjectKeys)].slice(0, 4);// Ensure unique keys and limit to 4
    
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
    return [...new Set(this.displayObjectKeys)]
    .filter(key => !key.toLowerCase().includes('account')) // Exclude any key with 'account'
    .slice(0, 3); 
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

get displayedSelectedRecordFields() {
    // Return an array of objects to be used in the template
    return Object.keys(this.selectedRecordFields).map(key => {
        return { key, value: this.selectedRecordFields[key] };
    });
}


}
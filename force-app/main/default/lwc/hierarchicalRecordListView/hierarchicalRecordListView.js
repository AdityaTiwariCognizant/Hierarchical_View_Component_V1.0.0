import { LightningElement,wire,api,track } from 'lwc';
import getChildRecords from '@salesforce/apex/HierarchicalViewController.getRelatedChildRecords';
import { getRelatedListsInfo } from "lightning/uiRelatedListApi";
import { getRecord } from 'lightning/uiRecordApi';
import {NavigationMixin} from 'lightning/navigation';


// matching/similar strings for some fields that make sense to be displayed
const FIELD_CRITERIA = ['Time','Title','Date','Account','Type','Status','Priority', 'Amount','Phone'];

export default class HierarchicalRecordListView extends NavigationMixin(LightningElement) {

    @api recordid; 
    @api flexipageRegionWidth;
    @api parentobjectapiname;
    @api childobjectapiname;
    
    @track childRecords = [];
    @track viewableChildRecords = [];
    @track relatedListsObjectAttributes;
    @track toDisplayFieldNames = [];
    @track openedObjectRecordId;

    relatedListsSummary;
    selectedRecordId;

    recordClicked = false;
    requireViewAll = false;
    showNoDataCard = false;
    isLoading = true;


    /*Method : Apex wired method to fetch related records to the object
               whoes recordId is being passed as parameter
         @param recordId :  recordId of current object whose related records
                            are needed to be displayed
         @param parentObjectApiName : objectApiName of the current object
         @param childObjectApiName : objectApiName of the related (opened) object
    */

@wire(getChildRecords,{recordId:'$recordid',parentObjectApiName:'$parentobjectapiname',childObjectApiName:'$childobjectapiname'})
    wiredChildRecord({error,data}){
        if(data) {
            if (Array.isArray(data) && data.length > 0) {
            this.childRecords = data;
            //for compactness we will display only 4 records on ui
            this.viewableChildRecords = this.childRecords.slice(0,4);
        
            //providing a button to view all records if no. of records > 4
            if(this.childRecords.length > 4) {
                this.requireViewAll = true
            }
            //picking up the record id of a record to get object metadata 
            // for preparing datatable display fields - any record will do
            this.openedObjectRecordId = this.viewableChildRecords[0].id;
            
        }
        else {
            //handling empty data for child records
            console.log('No related records found');
            this.relatedRecords = [];
            this.showNoDataCard = true;
            this.recordClicked = false;
        }
        setTimeout(() => {
            this.isLoading = false;
        }, 400);
        }
        else if (error) {
        console.error(error);
        console.log(error);
    }

}

// Event handler for selection of particular related record
handleRecordSelection(event) {

    this.recordClicked = true;
    const clickedId = event.currentTarget.dataset.id; // Extract ID from data attribute
    console.log('Clicked ID:', clickedId);
    this.selectedRecordId = clickedId;
    this.selectedRecord = this.childRecords.find(record => record.id === clickedId);
    console.log('$$$ ' + JSON.stringify(this.selectedRecord));

    this.processSelectedRecordFields();

    const evt = new CustomEvent('recordselection', {
        detail: { id: event.currentTarget.dataset.id,
            name : this.selectedRecord.name 
         }
    });
    this.dispatchEvent(evt);

}



// processing the fields of record selected on ui to show in expanded view
processSelectedRecordFields() {
    if (this.selectedRecord) {
        const selectedFields = {};
        // Iterate over filteredObjectFields and find corresponding data in selectedRecord
        this.filteredObjectFields.forEach(key => {
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

// while in the expanded view, whenever user click the record 
// ui will navigate to that record's record page
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

// Event handler for action of collapsing an opened related record
handleRecordCollapse(event) {

    this.recordClicked = false;
    this.selectedRecord = null;
    this.selectedRecordFields = {}; 

    const evt = new CustomEvent('recordcollapse', {
        detail: { id : '', name : '' }
    });
    this.dispatchEvent(evt);

}

/*Method : Salesforce standard UI wired method to fetch list of object
           and their attributes related to the supplied objectApiName
        
         @param parentObjectApiName : objectApiName of the opened related object
    */
@wire(getRelatedListsInfo, { parentObjectApiName: '$childobjectapiname'})
wiredRelatedLists({ error, data }) {
    if (data) {
        //console.log('Related Lists Data:', data);
        this.relatedListsSummary = data.relatedLists; // Store the related lists data
        //console.log('Related List :'+this.relatedListsSummary);
    

        this.relatedListsObjectAttributrs = this.relatedListsSummary.map(item => ({
            label : item.entityLabel,
            value : item.entityLabel, // Use entityLabel as the value
            iconUrl : item.themeInfo.iconUrl,
            color : '#' + item.themeInfo.color,
            isVisible : false
        }));
        // console.log('Related list object attributes :'+JSON.stringify(this.relatedListsObjectAttributes));

    } 
    else if (error) {
        console.error('Error fetching related lists:', error);
    }

}

// Creating relationship keyword for both Standard & Custom Objects
findRelationShipName(childObjApiName) {

    const suffix = childObjApiName.slice(-2)
    if(suffix == '_c') {
        console.log('Child Relationship name :' + childObjApiName + '__r');
        return childObjApiName + '__r';
    }
    else {
        console.log('Child Relationship name :' + childObjApiName + 's');
        return childObjApiName + 's';
    }
}

// Event handler to view all button : will navigate ui to all related record list
handleViewAll(evt) {

    console.log('recordid ' + this.recordid);
    console.log('parent object api name ' + this.parentobjectapiname);
    console.log('relationship name ' + this.findRelationShipName(this.childobjectapiname));

    this[NavigationMixin.Navigate]({
        type : 'standard__recordRelationshipPage',
        attributes : {
            recordId : this.recordid,  // The parent record ID
            objectApiName : this.parentobjectapiname,
            relationshipApiName : this.findRelationShipName(this.childobjectapiname),  // The dynamic relationship name
            actionName : 'view'  // View the related list
        }
        
    });
 
}

/*Method : Standard Salesforce lightning method to fetch metadata of an object
           whoes recordId is being passed as parameter
@param recordId :  recordId of current object whose related fields
                   are neededs to be processed and displayed on UI
        
    */

@wire(getRecord, { recordId: '$openedObjectRecordId', layoutTypes: ['Compact'] })
wiredRecord({ error, data }) {
    if (data) {
        this.recordData = data.fields; // Get field data
        //console.log('DATA FIELDS '+JSON.stringify(this.recordData));

        console.log('DISPLAY FIELDS ' + JSON.stringify(this.filterAndModifyObject(this.recordData)));
        this.displayObject = this.filterAndModifyObject(this.recordData);

        this.toDisplayFieldNames = Object.keys(this.displayObject).filter(key => {
            // Only keep the fields that have 'displayValue' and 'value' properties
            return this.displayObject[key]?.displayValue !== undefined && this.displayObject[key] ?. value !== undefined;
        });
        console.log('DISPLAY OBJ KEYS ' + JSON.stringify(this.toDisplayFieldNames));

    } else if (error) { 
        console.error('Error retrieving record:', error);
    }
}

// Logic for - Filter and determining the fields to display

filterAndModifyObject(inputObject) {
    // Step 1: Separate keys with 'name' or 'number' and those that don't
    let alwaysIncludedFields = {};
    let filteredFields = {};

    // Step 2: Separate keys based on whether they contain 'name' or 'number'
    Object.keys(inputObject).forEach((key) => {
        const value = inputObject[key];

        // Check if the key matches any of the criteria in FIELD_CRITERIA (case insensitive match)
        const matchesCriteria = FIELD_CRITERIA.some(criteria => 
            key.toLowerCase().includes(criteria.toLowerCase())
        );

        // If the key matches any of the FIELD_CRITERIA criteria, include it in filteredFields
        if (matchesCriteria && value && value.displayValue !== null && value.displayValue !== '') {
            filteredFields[key] = value;
        }

        // Always include keys that contain 'name' or 'number' in the key, regardless of displayValue
        else if (key.toLowerCase().includes('name') || key.toLowerCase().includes('number')) {
            alwaysIncludedFields[key] = value;
        }        

        // Exclude the ownerid field explicitly
        else if (key.toLowerCase().includes('ownerid')) {
            // Don't add anything to filteredFields for ownerid
        }
        // For other fields, include them only if displayValue is not null
         else if (value.value !== '') {
             filteredFields[key] = value;
         }
    });

    // Step 3: Combine alwaysIncludedFields with the rest of the filteredFields
    const toDisplayFields = { ...alwaysIncludedFields, ...filteredFields };

    // Step 4: Sort the keys by the size of their value's displayValue (if present), else by the size of the value field
    const sortedKeys = Object.keys(toDisplayFields)
        .sort((a, b) => {
            const valueA = toDisplayFields[a];
            const valueB = toDisplayFields[b];

            // Length of the displayValue or the value if displayValue is null
            const lengthA = valueA.displayValue ? valueA.displayValue.length : (valueA.value ? valueA.value.toString().length : 0);
            const lengthB = valueB.displayValue ? valueB.displayValue.length : (valueB.value ? valueB.value.toString().length : 0);

            return lengthA - lengthB;  // Sort by increasing length
        });

    return toDisplayFields;
}


// getUniqueRecords(records) {
//     const uniqueRecords = [];
//     const recordIds = new Set();

//     records.forEach(record => {
//         if (!recordIds.has(record.id)) {
//             recordIds.add(record.id);
//             uniqueRecords.push(record);
//         }
//     });

//     return uniqueRecords;
// }

get filteredObjectFields() {
    return [...new Set(this.toDisplayFieldNames)].slice(0, 4);// Ensure unique keys and limit to 4
    
}



// New computed property to get all record values based on filtered keys
displayRecordValues() {
    return this.viewableChildRecords.map(record => {
        return this.filteredObjectFields.map(key => {
            const propertyKey = key.toLowerCase(); // Convert to lowercase
            return {
                key: key,
                value: this.viewableChildRecords[propertyKey] || '' // Access the property dynamically
            };
        });
    });
}
// explicitly removed account keyword due to many non-useful fields being included
get filteredObjectFields() {
    return [...new Set(this.toDisplayFieldNames)]
    .filter(key => !key.toLowerCase().includes('account')) // Exclude any key with 'account'
    .slice(0, 3); 
}

// get filteredRecords() {
//     return this.viewableChildRecords.map(record => {
//         return this.filteredObjectFields.map(key => {
//             return {
//                 key : key,
//                 value : record[key.toLowerCase()] || '' // Dynamically access record properties
//             };
//         });
//     });
// }

// filtering records from viewableChildRecords object array
// with the filtered fields by string matching 
get filteredRecords() {
    return this.viewableChildRecords.map((record) => {
        return {
            id: record.id, // Add the record ID here for unique identification
            values : this.filteredObjectFields.map((key) => {
                return {
                    key : key,
                    value : record[key.toLowerCase()] || '' // Dynamically access record properties
                };
            })
        };
    });
}

get displayedSelectedRecordFields() {
    // Return an array of objects to be used in the template
    return Object.keys(this.selectedRecordFields).map(key => {
        return { key, value : this.selectedRecordFields[key] };
    });
}

}
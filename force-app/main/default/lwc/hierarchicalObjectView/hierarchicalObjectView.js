import { LightningElement, api, track, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getRelatedListCount, getRelatedListsInfo } from "lightning/uiRelatedListApi"; // getRelatedListsInfo
import { getRecord } from 'lightning/uiRecordApi';
export default class HierarchicalObjectView extends LightningElement {

    @api flexipageRegionWidth;
    @api recordId;
    @api parentid;

    // below variables are used in html file to render Parent object Label and Icon
    parentObjectApiName;
    parentIcon;
    parentColor;
    
    // below variables are used in html file to render Child object Label and Icon
    childApiName;
    childIcon;
    childColor;
    
    // Map storing essential child Object data to be displayed 
    @track relatedListOptions;

    // HTML markup controlling variables
    expandedView = false;
    isLoading = true;
    showNoObjCard = false;
    showHeader = true;
    modifyHeader = '';

    // Collecting selected record attributes
    selectedObjectId;
    selectedRecordId;
    
    //slds class applied for UI changes 
    innerBodyClass = "slds-m-around_small  custom-card-border";

    // RelatedListId stores relationship between a parent and child object
    // It is being modified recursively
    relatedListId = '';

    // related object index (to iterate over related object list)
    relatedObjectIndex = 0;

    /*
    ********  wire methods below ***** 
    */


    /**
    * Method :Wired method to look for related list records attribute to verify which related
    * object contains related records in them
    * 
    * @param : parentRecordId - recordId of parent object of related list
    * @param : relatedListId - The API name of a related list or child relationship
    *                              (updated using recursive callback) 
    */  

    @wire(getRelatedListCount, {
        parentRecordId: '$recordId',
        relatedListId: '$relatedListId',
        maxCount: 1
    })
    wireCount({ error, data }) {
        if (data) {
            console.log('RELATED LIST COUNT DATA :::: '+JSON.stringify(data));
            this.relatedListOptions = this.relatedListOptions.map(item => {
                if (item.relatedListId === this.relatedListId) {
                    // return { ...item, recordCount: data.records.length};
                    return { ...item, recordCount: data.count};
                }
                return item;
            });
            this.relatedObjectIndex++;
            this.recursiveCallback();
        } else if (error) {
            console.log('getRelatedListRecords ERROR ### '+JSON.stringify(error));
          }
    }

    /**
    *Method: Standard Salesforce lightning method to fetch metadata of an object
    *        whoes recordId is being passed as parameter
    * @param recordId: recordId of current object whose related fields
    *                   are needed to be process and display ui data
    */
    @wire(getRecord, { recordId: '$recordId', layoutTypes:['Compact'] })
    wiredRecord({ error, data }) {
        if (data) {
           
            this.parentObjectApiName = data.apiName; // This is the line to extract the objectApiName
            
            if(this.parentObjectApiName.slice(-3) == '__c'){
            this.parentObjectLabel = this.removeSuffix(this.parentObjectApiName);
            }
            else{
                this.parentObjectLabel = this.parentObjectApiName; 
            }

            console.log('Record Id:' + this.recordId);
            console.log('ALL DATA :' + JSON.stringify(data));
            setTimeout(() => {
                this.isLoading = false;
            }, 200);
        } else if (error) {
            console.log('Error fetching record:', error);
        }        
    }

    /**
    * Method: Wired getObjectInfo to fetch themeinfo of parent object 
              (where component is added)
    *
    * @param parentObjectApiName: objectApiName of object whose themeinfo is needed                            
    */

    @wire(getObjectInfo, { objectApiName: '$parentObjectApiName' })
    parentObjectInfo({ error, data }) {
        if (data) {
            // Check if themeInfo exists before accessing its properties
        if (data.themeInfo) {
            this.parentIcon = data.themeInfo.iconUrl || null; // Default to null if iconUrl is undefined
            this.parentColor = data.themeInfo.color ? `#${data.themeInfo.color}` : null; // Default to null if color is undefined
        } else {
            // If themeInfo is null or undefined, set default values
            this.parentIcon = null;
            this.parentColor = null;
        }
        console.log('Parent Api Name: ' + this.parentObjectApiName);
        } else if (error) {
            console.log('Error fetching parent object info:', error);
        }
    }

    /**
    * Method: Wired getRelatedListsInfo to fetch relatedList objects and their 
    *        attributes
    * 
    * @param parentObjectApiName: objectApiName of object whose related list
    *                              needs to be fetched     
    */

    @wire(getRelatedListsInfo, { parentObjectApiName: '$parentObjectApiName',recordTypeId: "012000000000000AAA" })
    wiredRelatedLists({ error, data }) {
        if (data) {

            
            this.relatedListOptions = data.relatedLists
            .map(item => ({
                label : item.entityLabel,
                apiName : item.objectApiName,
                value : item.entityLabel, 
                iconUrl : item.themeInfo.iconUrl,
                color : '#'+item.themeInfo.color,
                isVisible :false,
                utility :'utility:chevronright',
                relatedListId : item.relatedListId 
                        
            }));
            console.log(' ### ALL ACCESS :' + JSON.stringify(this.relatedListOptions));

            if (!this.relatedListOptions || this.relatedListOptions.length === 0) {
                this.showNoObjCard = true;  // Set flag to show the "No related objects" message
                console.log('RELATEDLIST EMPTY');
            
            }

            this.recursiveCallback();



        } else if (error) {
            //console.logs('Error fetching related lists:', error);
            this.showNoObjCard = true;
        }
    }

    /** 
     * Method : Wire getObjectInfo to fetch themeinfo of selected related Object
     * @param objectApiName : apiName of related child object to fetch ui theme info 
     */

    @wire(getObjectInfo, { objectApiName: '$childApiName' })
    childObjectInfo({ error, data }) {
        if (data) {
            // Check if themeInfo is available in the data object before accessing its properties
            if (data.themeInfo) {
                this.childIcon = data.themeInfo.iconUrl || '';  // Use default empty string if iconUrl is not available
                this.childColor = data.themeInfo.color ? `#${data.themeInfo.color}` : '';  // Use default empty string if color is not available
            } else {
                // If themeInfo is not available, set default values
                this.childIcon = ''; 
                this.childColor = '';
            }
            console.log('Child Api Name: ' + this.childApiName);
            
        } else if (error) {
            //console.error('Error fetching child object info:', error);
            this.childIcon = '';  // Handle error by setting default values
            this.childColor = ''; // Handle error by setting default values
        }
    }

    /*
    ********  wire methods above ***** 
    */ 



    connectedCallback() {
        console.log('RECORD ID :'+this.recordId);
        
        if (this.recordId == null){
            this.showHeader = false;
            this.innerBodyClass = "slds-m-around_small";
            this.recordId = this.parentid;
        }
        console.log('PARENT ID:'+this.parentid);

        
    }

    // Removes the __c suffix from apiName if it exists
    removeSuffix(apiName) {
        return apiName.replace(/__c$/, ''); 
    }

    
    /*
     *  Event handler for action of selecting an object from related object list
     */
    expandClickedObject(event) {
        this.clearStaleData();
        this.expandedView = true;  

        //reset all list items first
        this.relatedListOptions.forEach(item => {
            item.isVisible = false;
            item.utility = 'utility:chevronright';
          
        });

        // Access the data-id attribute to get the clicked item's value
        const selectedValue = event.target.dataset.id;  
        this.selectedObject = this.relatedListOptions.find(item => item.value === selectedValue).apiName; // Find the object by value
        this.childObjName = this.relatedListOptions.find(item => item.value === selectedValue).label;
        this.childApiName = String(this.selectedObject);

       
        const item = this.relatedListOptions.find(item=>item.value === selectedValue);
        if(item) {
            item.isVisible = !item.isVisible;
            item.utility = 'utility:chevrondown'
            this.relatedListOptions = [...this.relatedListOptions];
            
        }
    }

    
    // apply style(color) for Parent Icon
    get iconParentStyle() {
        return `background-color: ${this.parentColor};`;
    }


    /*
    * Event handler for action of selecting a record
    */ 
    handleRecordSelection(event) {
        this.clearStaleData();

        this.selectedRecordId = event.detail.id;
        this.selectedRecordName = event.detail.name;
        console.log('SELECTED RECORD ID ' + this.selectedRecordId);
        this.modifyHeader = 'slds-m-right_medium link-style';

    }

    /*
    * Event handler for action of collapsing an expanded record
    */

    handleRecordCollapse(event) {
        console.log('Selected Record Collapsed');
        this.clearStaleData();
        this.parentid = '';
    }

    /*
    * Event handler for toggling expanded and collapsed view
    */
    toggleCard() {
        this.expandedView =! this.expandedView;
        
        this.relatedListOptions.forEach(item => {
            item.isVisible = false; // Toggle the boolean value
            item.utility = 'utility:chevronright';
        });

        // Update the items to trigger reactivity
        this.relatedListOptions = [...this.relatedListOptions]; 

        this.clearStaleData();
    }

    //getter to show chevron icon where included
    get showChevron() {
        return true; 
    }

    //function clears old data
    clearStaleData(){
        this.selectedRecordId = '';
        this.selectedRecordName = '';
        this.modifyHeader = '';
    }


    /*
     * Recursive Callback function to look-up each related object attribute of count 
     * This ensures only the Object that have related records in them appears on the
     * Object list
     */


    recursiveCallback() {
    
    if (this.relatedObjectIndex < this.relatedListOptions.length) {
        const data = this.relatedListOptions[this.relatedObjectIndex];
        this.relatedListId = data.relatedListId;  // Assign the current relatedListId to objName
       console.log('RELATED LIST ID *** '+this.relatedListId);
    } else {
        this.relatedObjectIndex = 0; // Reset the index once all items have been processed
        this.relatedListOptions = this.relatedListOptions.filter(item => item.recordCount > 0);
        console.log('FILTERD LIST ----- '+JSON.stringify(this.relatedListOptions));
        if(this.relatedListOptions == null || this.relatedListOptions.length <= 0){
            this.showNoObjCard = true;
        }
    }   

    }

}
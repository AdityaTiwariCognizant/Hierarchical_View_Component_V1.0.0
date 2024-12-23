import { LightningElement, api, track, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getRelatedListsInfo } from "lightning/uiRelatedListApi";
import { getRecord } from 'lightning/uiRecordApi';

export default class RelatedObjectMain extends LightningElement {

    @api flexipageRegionWidth;
    @api recordId;
    @api parentid;

    parentObjectApiName;
    parentIcon;
    parentColor;
    
    childApiName;
    childIcon;
    childColor;
    
    @track relatedLists;
    @track relatedListOptions;

    expandedView = false;
    isLoading = true;
    showNoObjCard = false;
    showHeader = true;
    modifyHeader = '';


    selectedObjectId;
    selectedRecordId;

    innerBodyClass = "slds-m-around_small  custom-card-border";


    connectedCallback() {
        console.log('RECORD ID :'+this.recordId);
        
        if (this.recordId == null){
            this.showHeader = false;
            this.innerBodyClass = "slds-m-around_small";
            this.recordId = this.parentid;
        }
        console.log('PARENT ID:'+this.parentid);
    }

   /*Method : Standard Salesforce lightning method to fetch metadata of an object
               whoes recordId is being passed as parameter
         @param recordId :  recordId of current object whose related fields
                            are needed to be process and display ui data
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
            console.error('Error fetching record:', error);
        }
        
    }

    removeSuffix(apiName) {
        return apiName.replace(/__c$/, ''); // Removes the __c suffix if it exists
    }

    //Fetch Parent Object Info
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
            console.error('Error fetching parent object info:', error);
        }
    }

   
    handleRowAction(event) {
        const actionName = event.detail.action.name;

        if (actionName === 'id_click') {
            const rowData = event.detail.row; 
            this.selectedObjectId = rowData.id; 
            this.selectedObjectName = rowData.name; 
            console.log('Selected Object ID:', this.selectedObjectId); 
            console.log('Selected Object Name:', this.selectedObjectName); 
            
        }
    
    }

    @wire(getRelatedListsInfo, { parentObjectApiName: '$parentObjectApiName',recordTypeId: "012000000000000AAA" })
    wiredRelatedLists({ error, data }) {
        if (data) {
            
            this.relatedLists = data.relatedLists; 
            console.log('Related List ' + JSON.stringify(this.relatedLists));
        

            this.relatedListOptions = this.relatedLists.map(item => ({
                label : item.entityLabel,
                apiName : item.objectApiName,
                value : item.entityLabel, 
                iconUrl : item.themeInfo.iconUrl,
                color : '#'+item.themeInfo.color,
                isVisible :false,
                utility :'utility:chevronright'
            }));
            console.log(' ### ALL ACCESS :' + JSON.stringify(this.relatedListOptions));

            if (!this.relatedLists || this.relatedLists.length === 0) {
                this.showNoObjCard = true;  // Set flag to show the "No related objects" message
                console.log('RELATEDLIST EMPTY');
            }

        } else if (error) {
            console.error('Error fetching related lists:', error);
            this.showNoObjCard = true;
        }
    }

   

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
            this.relatedListOptions = [...this.relatedListOptions]
            
        }

       // console.log('%%%%% '+JSON.stringify(this.relatedListOptions));
    }

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
            console.error('Error fetching child object info:', error);
            this.childIcon = '';  // Handle error by setting default values
            this.childColor = ''; // Handle error by setting default values
        }
    }
    
    // Style for Parent Icon
    get iconParentStyle() {
        return `background-color: ${this.parentColor};`;
    }

    // Style for Child Icon
    get iconChildStyle() {
        return `background-color: ${this.childColor};`;
    }

    handleRecordSelection(event) {
        this.clearStaleData();

        this.selectedRecordId = event.detail.id;
        this.selectedRecordName = event.detail.name;
        console.log('SELECTED RECORD ID ' + this.selectedRecordId);
        this.modifyHeader = 'slds-m-right_medium link-style';

    }

    handleRecordCollapse(event) {
        console.log('Selected Record Collapsed');
        this.clearStaleData();
        this.parentid = '';
    }

    itemStyle(color) {
        return `background-color: ${color};`;
    }

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

    get showChevron() {
        return true; 
    }

    clearStaleData(){
        this.selectedRecordId = '';
        this.selectedRecordName = '';
        this.modifyHeader = '';
    }
    
}
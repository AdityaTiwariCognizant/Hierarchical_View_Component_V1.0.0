import { LightningElement, api, track, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getRelatedListsInfo } from "lightning/uiRelatedListApi";
import { getRecord } from 'lightning/uiRecordApi';

export default class RelatedObjectMain extends LightningElement {
    @track parentObjectApiName;
    @api flexipageRegionWidth;
    parentIcon;
    parentColor;
    @track childIcon;
    @track childColor;
    @api recordId;
    @api parentid;
    
    @track relatedLists;
    @api relatedListOptions;
    selectedRelatedObject;
    @track expandedView = false;
    @track childApiName;
    @track selectetObjectApiName;

    @track selectedObjectId;

    showHeader = true;

    innerBodyClass = "slds-m-around_small  custom-card-border";

    selectedRecordId;
    modifyHeader = '';

    connectedCallback(){
        console.log('RECORD ID :'+this.recordId);
        
        if (this.recordId==null){
            this.showHeader = false;
            this.innerBodyClass = "slds-m-around_small";
            this.recordId = this.parentid;
        }
        console.log('PARENT ID:'+this.parentid);
    }

   

    @track childRecords=[];

    fields = ['id'];
    //id,name or autonumber, created date

    @wire(getRecord, { recordId: '$recordId', layoutTypes:['Compact'] })
    wiredRecord({ error, data }) {
        if (data) {
           
            this.parentObjectApiName = data.apiName; // This is the line to extract the objectApiName
            console.log('Record Id:'+this.recordId);
            console.log('ALL DATA :'+JSON.stringify(data));
        } else if (error) {
            console.error('Error fetching record:', error);
        }
    }

    @wire(getObjectInfo, { recordId: '$recordId' })
    objectInfo({ data, error }) {
        if (data) {
            this.parentObjectApiName = data.objectApiName; // Get the object API name from the response
            console.log('Object API Name:', this.objectApiName); // For debugging
        } else if (error) {
            console.error('Error fetching object info:', error);
        }
    }

    //Fetch Parent Object Info
    @wire(getObjectInfo, { objectApiName: '$parentObjectApiName' })
    parentObjectInfo({ error, data }) {
        if (data) {
            this.parentIcon = data.themeInfo.iconUrl; // Set the icon name dynamically
            this.parentColor = `#${data.themeInfo.color}`;
            // console.log('Parent icon :', this.parentIcon);
            // console.log('Parent icon color:', this.parentColor);
            // console.log('Parent Api Name: '+this.parentObjectApiName);
        } else if (error) {
            console.error('Error fetching parent object info:', error);
        }
    }

    columns = [
        { 
            label: 'Record ID',
            fieldName: 'id',
            type: 'button', // Make the ID field clickable
            typeAttributes: {
                label: { fieldName: 'id' },  // Display the 'id' value as a label on the button
                name: 'id_click', // Custom name for the action
                variant: 'base' // You can change the button style (e.g., 'neutral', 'brand')
            }
        },
        { label: 'Name', fieldName: 'name' },
        { label: 'Email', fieldName: 'email' },
        
        
    ];

   
    handleRowAction(event){
        const actionName = event.detail.action.name; // Get the action name

        if (actionName === 'id_click') {
            const rowData = event.detail.row; // Get row data
            this.selectedObjectId = rowData.id; // Capture the record ID
            this.selectedObjectName = rowData.name; // Capture the record Name
            console.log('Selected Object ID:', this.selectedObjectId); 
            console.log('Selected Object Name:', this.selectedObjectName); 
            

        }
        fields 
    
    }

    @wire(getRelatedListsInfo, { parentObjectApiName: '$parentObjectApiName',recordTypeId: "012000000000000AAA" })
    wiredRelatedLists({ error, data }) {
        if (data) {
            //console.log('Related Lists Data:', data);
            this.relatedLists = data.relatedLists; // Store the related lists data
            console.log('Related List :'+JSON.stringify(this.relatedLists));
        

            this.relatedListOptions = this.relatedLists.map(item => ({
                label: item.entityLabel,
                value: item.entityLabel, // Use entityLabel as the value
                iconUrl: item.themeInfo.iconUrl,
                color: '#'+item.themeInfo.color,
                isVisible:false,
                utility:'utility:chevronright'
            }));
            //console.log('Related list options :'+JSON.stringify(this.relatedListOptions));

        } else if (error) {
            console.error('Error fetching related lists:', error);
        }
    }

   

    expandClickedObject(event) {
        this.selectedRecordId = '';
        this.selectedRecordName = '';
        this.modifyHeader = '';
        this.expandedView = true;  // Show the expanded view

        //reset all list items first
        this.relatedListOptions.forEach(item => {
            item.isVisible = false; // Toggle the boolean value
            item.utility = 'utility:chevronright'
        });

        // Access the data-id attribute to get the clicked item's value
        const selectedValue = event.target.dataset.id;  // Get the value from the clicked element's data-id
        this.selectedObject = this.relatedListOptions.find(item => item.value === selectedValue).label; // Find the object by value
        this.childApiName = String(this.selectedObject);

        if(this.childApiName.includes(' ') && !this.childApiName.includes(',') && !this.childApiName.includes(':') ){
            this.childApiName = this.childApiName.split(' ').join('_')+'__c';
        }

        // Log the selected object to the console
        const item = this.relatedListOptions.find(item=>item.value === selectedValue);
        if(item){
            item.isVisible = !item.isVisible;
            item.utility = 'utility:chevrondown'
            this.relatedListOptions = [...this.relatedListOptions]


        }

       // console.log('%%%%% '+JSON.stringify(this.relatedListOptions));
    }

    //Fetch 1-degree-child Object Info
    @wire(getObjectInfo, { objectApiName: '$childApiName' })
    childObjectInfo({ error, data }) {
        if (data) {
            this.childIcon = data.themeInfo.iconUrl; // Set the icon name dynamically
            this.childColor = `#${data.themeInfo.color}`;
            // console.log('Child icon :', this.childIcon);
            // console.log('Child icon color:', this.childColor);
            // console.log('Child Api Name: '+this.childApiName);
        } else if (error) {
            console.error('Error fetching child object info:', error);
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

    handleRecordSelection(event){
        this.selectedRecordId = '';
        this.selectedRecordName = '';

        this.modifyHeader = '';

        this.selectedRecordId = event.detail.id;
        this.selectedRecordName = event.detail.name;
        console.log('SELECTED RECORD ID '+this.selectedRecordId);
        this.modifyHeader = 'slds-m-right_medium link-style';

    }

    handleRecordCollapse(event){
        console.log('Selected Record Collapsed');
        this.selectedRecordId = '';
        this.selectedRecordName = '';
        this.modifyHeader = '';
        this.parentid='';
    }

    itemStyle(color) {
        return `background-color: ${color};`;
    }

    toggleCard(){
        this.expandedView=!this.expandedView;
        


        this.relatedListOptions.forEach(item => {
            item.isVisible = false; // Toggle the boolean value
            item.utility = 'utility:chevronright';
        });

        // Update the items to trigger reactivity
        this.relatedListOptions = [...this.relatedListOptions]; 

        this.selectedRecordId='';
        this.selectedRecordName = '';

        this.modifyHeader = '';
        
       
    }

    get showChevron() {
        return true;  // Only show chevron if related records exist
    }

    
}
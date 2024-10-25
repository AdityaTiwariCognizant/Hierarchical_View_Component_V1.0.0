import { LightningElement, api, wire, track } from 'lwc';
import fetchAccountRelatedContacts from '@salesforce/apex/hierarchicalViewController.fetchAccountRelatedContacts';
import fetchRelatedAccounts from '@salesforce/apex/hierarchicalViewController.fetchRelatedAccounts';

export default class CollapseExpandCardDemo extends LightningElement {
    @api recordId = '0015j00000cdYijAAE';
    @track contacts;
    @track selectedContact;
    @track relatedAccounts;
    @track isExpanded = false;

    @track columns = [
        {
            label: 'First Name',
            fieldName: 'FirstName',
            type: 'text',
            cellAttributes: {
                class: 'slds-text-link slds-text-link_reset',
             
            },
            // Set the action name
            typeAttributes: {
                actionName: 'view_details',
            },
        },
        { label: 'Last Name', fieldName: 'LastName' },
        { label: 'Email', fieldName: 'Email', type: 'email' },
    ];

    @wire(fetchAccountRelatedContacts, { accountId: '$recordId' })
    wiredContacts({ error, data }) {
        if (data) {
            this.contacts = data;
        } else {
            this.contacts = undefined;
        }
    }

    handleContactClick(event){
        const contactID = event.detail.actionName
    }


    get iconName() {
        return this.isExpanded ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get cardClass() {
        return this.isExpanded ? 'slds-card__body' : 'slds-hide';
    }

    toggleCard() {
        this.isExpanded = !this.isExpanded;
    }
}

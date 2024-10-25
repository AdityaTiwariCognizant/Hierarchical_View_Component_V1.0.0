public with sharing class hierarchicalViewController {
    @AuraEnabled(cacheable=true)
    public static List<Contact> fetchAccountRelatedContacts(Id accountId) {
        return [SELECT Id,FirstName,LastName, Email
                FROM Contact 
                WHERE AccountId = :accountId 
                LIMIT 5];

    }

    @AuraEnabled(cacheable=true)
    public static List<Account> fetchRelatedAccounts(Id contactId){
        return [SELECT Id, Name FROM Account WHERE Id IN (SELECT AccountId FROM Contact WHERE Id = :contactId)];

    }

}
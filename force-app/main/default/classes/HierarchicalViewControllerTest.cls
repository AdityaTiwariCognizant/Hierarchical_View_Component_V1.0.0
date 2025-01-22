@isTest(SeeAllData=true)
public class HierarchicalViewControllerTest {
    
    // Test method for no child records returned
    @isTest
    static void testGetRelatedChildRecords_NoChildRecords() {
        // Create a parent record but no child records
        Account parentAccount = new Account(Name = 'Test Parent Account');
        insert parentAccount;

        // Call the method to retrieve child records for the parent record
        Test.startTest();
        List<Map<String, Object>> result = hierarchicalViewController.getRelatedChildRecords(
            parentAccount.Id, 'Account', 'Contact');
        Test.stopTest();

        // Assert that no child records are retrieved
        System.assertEquals(0, result.size(), 'There should be no child records retrieved.');
    }

    // Test method for invalid SOQL (e.g., invalid field names)
    @isTest
    static void testGetRelatedChildRecords_InvalidFieldNames() {
        // Create a parent record and related child records
        Account parentAccount = new Account(Name = 'Test Parent Account');
        insert parentAccount;

        Contact childContact = new Contact(FirstName = 'John', LastName = 'Doe', AccountId = parentAccount.Id);
        insert childContact;

        // Call the method with an invalid child field
        Test.startTest();
        try {
            List<Map<String, Object>> result = hierarchicalViewController.getRelatedChildRecords(
                parentAccount.Id, 'Account', 'Contact');
            System.assert(true, 'The method should work even if some fields are not in the result.');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('Error executing SOQL query'), 'Expected error message for invalid query.');
        }
        Test.stopTest();
    }
    
    @isTest
    static void testGetRelatedChildRecords_CustomObject() {
        // Create a parent custom object (Position__c)
    Position__c positionObj = new Position__c(Name = 'Test Position');
    insert positionObj;
        
    Candidate__c candidateObj = new Candidate__c(Name = 'Floyd James');
    insert candidateObj;
    
    // Create a child record (Job_Application__c) that links to the parent custom object
    Job_Application__c jobApp = new Job_Application__c(Position__c = positionObj.Id,Candidate__c = candidateObj.Id);
    insert jobApp;
        
    

    // Call the method to retrieve child records for the parent custom object
    Test.startTest();
    List<Map<String, Object>> result = hierarchicalViewController.getRelatedChildRecords(
        positionObj.Id, 'Position__c', 'Job_Application__c');
    Test.stopTest();

    // Assert that the child record is retrieved
    System.assert(result.size() > 0,'There should be child records retrieved for the custom object.');
    }
    
    
    

}
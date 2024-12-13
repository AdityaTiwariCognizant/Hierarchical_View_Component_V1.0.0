public with sharing class hierarchicalViewController {
    
    @AuraEnabled(cacheable=true)
	public static List<Map<String, Object>> getRelatedChildRecords(Id recordId, String parentObjectApiName, String childObjectApiName) {
        System.debug(parentObjectApiName);

    	System.debug(childObjectApiName);

    string temp = parentObjectApiName;
    if(parentObjectApiName.right(2) == '_c'){
        parentObjectApiName = parentObjectApiName.trim().replace('__c', '__r');
    }
    
    List<Map<String, Object>> result = new List<Map<String, Object>>();
    
    // Input validation
    if (recordId == null || String.isEmpty(parentObjectApiName) || String.isEmpty(childObjectApiName)) {
        System.debug('1 Error : Parent or Child or id empty');
        throw new AuraHandledException('Invalid input parameters. Please provide valid recordId, parentObjectApiName, and childObjectApiName.');
    }
    
    try {
         //Get the child object schema to dynamically fetch fields
        Schema.SObjectType childType = Schema.getGlobalDescribe().get(childObjectApiName);
        if (childType == null) {
            System.debug('2 Error : no related child exist');
            throw new AuraHandledException('Child object type not found for: ' + childObjectApiName);
        }
        
        Schema.DescribeSObjectResult childDescribe = childType.getDescribe();
        Map<String, Schema.SObjectField> childFields = childDescribe.fields.getMap();
        
        // If there are no fields in the child object, throw an error
        if (childFields.isEmpty()) {
            System.debug('3 Error : Child fields are empty');
            throw new AuraHandledException('No fields found for child object: ' + childObjectApiName);
        }
   
        List<String> fieldNames = new List<String>();
        for (String fieldName : childFields.keySet()) {
            fieldNames.add(fieldName);
        }
        
        // Construct the dynamic SOQL query
        String soqlQuery;
    	if (temp.right(2) == '_c') {
    	// For custom objects, ensure the correct relationship name is used.
    	String relationshipField = parentObjectApiName + '.Id';
    	soqlQuery = 'SELECT ' + String.join(fieldNames, ', ') + 
                ' FROM ' + childObjectApiName + 
                ' WHERE ' + relationshipField + ' = :recordId ';
		} else {
    	// For standard objects, use the relationship field properly
    	soqlQuery = 'SELECT ' + String.join(fieldNames, ', ') + 
                ' FROM ' + childObjectApiName + 
                ' WHERE ' + childObjectApiName + '.' + parentObjectApiName + 'Id = :recordId ';
		}

		soqlQuery = QueryValidator.removeInvalidFields(soqlQuery,childObjectApiName);
		
        
        // Execute the query inside a try-catch to handle any query exceptions
        List<SObject> childRecords = new List<SObject>();
        try {
            childRecords = Database.query(soqlQuery);
        } catch (QueryException e) {
            System.debug('4 Error :'+e.getMessage());
            throw new AuraHandledException('Error executing SOQL query: ' + e.getMessage());
        }
        
        // Convert the child records into a list of maps (key-value pairs)
        for (SObject childRecord : childRecords) {
            Map<String, Object> childData = new Map<String, Object>();
            for (String fieldName : childFields.keySet()) {
                childData.put(fieldName, childRecord.get(fieldName));
            }
            result.add(childData);
        }
        
    } catch (Exception e) {
        // Catch and rethrow AuraHandledExceptions to be handled by the Aura framework
        System.debug('5 Error :'+e.getMessage());
      //throw e;
  } 
       // catch (Exception e) {
        // General catch for any other unforeseen errors
       //  System.debug(' Error 6 :'+e.getMessage());
      //  throw new AuraHandledException('An unexpected error occurred: ' + e.getMessage());
   // }
    
    System.debug('Resulting Records :'+result);
    return result;
}
}
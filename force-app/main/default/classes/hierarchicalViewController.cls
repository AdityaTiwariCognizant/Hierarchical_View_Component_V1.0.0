public with sharing class hierarchicalViewController {
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getRelatedChildRecords(Id recordId, String parentObjectApiName, String childObjectApiName) {
        List<Map<String, Object>> result = new List<Map<String, Object>>();
        
        // Get the child object schema to dynamically fetch fields
        Schema.SObjectType childType = Schema.getGlobalDescribe().get(childObjectApiName);
        Schema.DescribeSObjectResult childDescribe = childType.getDescribe();
        Map<String, Schema.SObjectField> childFields = childDescribe.fields.getMap();
        
        List<String> fieldNames = new List<String>();
        for (String fieldName : childFields.keySet()) {
            fieldNames.add(fieldName);
        }
        
        String soqlQuery = 'SELECT ' + String.join(fieldNames, ', ') + 
                            ' FROM ' + childObjectApiName + 
                            ' WHERE ' + childObjectApiName +'.'+parentObjectApiName+'Id= :recordId ' +
                            'LIMIT 4';
        
        
        System.debug(' ### SOQL ### '+soqlQuery);
        
        // Execute the query
        List<SObject> childRecords = Database.query(soqlQuery);

        // Convert the child records into a list of maps (key-value pairs)
        for (SObject childRecord : childRecords) {
            Map<String, Object> childData = new Map<String, Object>();
            for (String fieldName : childFields.keySet()) {
                childData.put(fieldName, childRecord.get(fieldName));
            }
            result.add(childData);
        }
		
        //System.debug('++++ Related Record List ++++ '+result);
        return result;
    }
}
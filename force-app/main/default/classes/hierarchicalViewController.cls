public with sharing class HierarchicalViewController {
    
    /**
     * Retrieves a list of child records related to a given parent record, based on dynamic parent and child object API names.
     * This method performs input validation, dynamically constructs a SOQL query based on the objects provided, 
     * and returns a list of child records in a map format, where each record is represented by a map of field values.
     * 
     * @param recordId The ID of the parent record for which related child records need to be retrieved.
     * @param parentObjectApiName The API name of the parent object (standard or custom).
     * @param childObjectApiName The API name of the child object (standard or custom).
     * 
     * @return List<Map<String, Object>> A list of maps, where each map contains field names as keys and field values as corresponding values 
     *         for each child record related to the provided parent record. The list can be empty if no child records are found.
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getRelatedChildRecords(Id recordId, String parentObjectApiName, String childObjectApiName) {

        System.debug('RECORD ID ::: '+recordId);
        System.debug('parentObjectApiName ::: '+parentObjectApiName);
        System.debug('childObjectApiName ::: '+childObjectApiName);


        // If the parent object is custom, replace the suffix '__c' with '__r' for the relationship field
        String temp = parentObjectApiName;
        if (parentObjectApiName.endsWith('_c')) {
            parentObjectApiName = parentObjectApiName.trim().replace('__c', '__r');
        }

        // Initialize the result list that will hold the child record data as maps
        List<Map<String, Object>> result = new List<Map<String, Object>>();

        // Input validation: Ensure that no parameter is null or empty
        if (recordId == null || String.isEmpty(parentObjectApiName) || String.isEmpty(childObjectApiName)) {
            System.debug('Error: Invalid input parameters. Parent Object or Child Object name or Record ID is empty.');
            return result; // Early return if invalid parameters are found
        }

        try {
            // Get the child object schema to dynamically fetch fields based on the child object API name
            Schema.SObjectType childType = Schema.getGlobalDescribe().get(childObjectApiName);
            if (childType == null) {
                System.debug('Error: Child object type not found for: ' + childObjectApiName);
                return result; // Return empty result if no child object found
            }
            
            // Describe the child object and retrieve its field map
            Schema.DescribeSObjectResult childDescribe = childType.getDescribe();
            Map<String, Schema.SObjectField> childFields = childDescribe.fields.getMap();
            
            // If there are no fields in the child object, log the error and return empty result
            if (childFields.isEmpty()) {
                System.debug('Error: No fields found for child object: ' + childObjectApiName);
                return result;
            }

            // Collect the field names from the child object fields map
            List<String> fieldNames = new List<String>();
            for (String fieldName : childFields.keySet()) {
                fieldNames.add(fieldName);
            }

            // Construct the dynamic SOQL query based on whether the parent is a custom object or standard object
            String soqlQuery;
            if (temp.endsWith('_c')) {
                // For custom objects, ensure the correct relationship name is used
                String relationshipField = parentObjectApiName + '.Id';
                soqlQuery = 'SELECT ' + String.join(fieldNames, ', ') + 
                            ' FROM ' + childObjectApiName + 
                            ' WHERE ' + relationshipField + ' = :recordId ORDER BY CreatedDate DESC LIMIT 7';
            } else {
                // For standard objects, use the relationship field properly
                soqlQuery = 'SELECT ' + String.join(fieldNames, ', ') + 
                            ' FROM ' + childObjectApiName + 
                            ' WHERE ' + childObjectApiName + '.' + parentObjectApiName + 'Id = :recordId ORDER BY CreatedDate DESC LIMIT 7';
            }

            // Query the child records using the constructed SOQL query
            List<SObject> childRecords = Security.stripInaccessible(AccessType.READABLE, Database.query(soqlQuery)).getRecords();


            // Convert the child records into a list of maps (key-value pairs) for easier consumption by the front-end
            for (SObject childRecord : childRecords) {
                Map<String, Object> childData = childRecord.getPopulatedFieldsAsMap();
                result.add(childData);
            }

        } catch (Exception e) {
            // Log any errors and continue processing (no exception handling needed)
            System.debug('Error: ' + e.getMessage());
        }

        // Debugging the resulting child records
        System.debug('Resulting Records: ' + result);
        return result;
    }
}
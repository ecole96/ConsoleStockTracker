// this file consists of helper functions used among all of the form components

// helper function for form client side validation - during validation, error arrays are populated for each field; if any of those arrays are not empty, then the form is invalid
export function formIsValid(errors) {
    for (const field in errors) {
        if(errors[field].length > 0)
            return false;
    }
    return true;
}

// helper function for User-related POST endpoints - generates payload consisting of notification preferences from form and user email (if registering - otherwise, email is in endpoint URL so left null)
export function generateUserPayload(email,notify) {
    let filtered = notify.filter(element => ['series_x','series_s','ps5','ps5d'].includes(element)); // sanitizing notify to only accepted values
    let payload = {'series_x':false,'series_s':false,'ps5':false,'ps5d':false}; // initialize notification preferences
    if(email) { payload['email'] = email};
    for (const console of filtered) {
        payload[console] = true; // set only checked consoles to true
    }
    return payload;
}

// renders form errors by field, if any errors for that field exist
// 'field' parameter is the field name, while 'field_errors' is the array of that field's error messages (taken from 'errors' dict in form states)
export function renderErrors(field,field_errors) {
    return field_errors.length < 1 ? null : 
    <ul id={`${field}_errors`} key={field}>
        {field_errors.map((err, index) => 
            <li key={index}><small className="form-text text-danger font-weight-bold">{err}</small></li>
        )}
    </ul>;
}
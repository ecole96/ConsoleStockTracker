import React, { Component } from 'react';
import axios from 'axios';
import {formIsValid, generateUserPayload, renderErrors} from './form-functions.js';

// other form components (update-form and leave-form) are very similar to this one, so the bulk of the comments are here for the sake of avoiding redundancy

export default class JoinForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '', // email user wants to sign-up with
            confirm_email: '', // confirmation of user email (must match email field)
            notify: [], // which consoles the user wants to be notified about while signing up (series_x = Xbox Series X, series_s = Xbox Series S, ps5 = PS5 Standard, ps5d = PS5 Digital)
            errors: {'email':[],'confirm_email':[],'notify':[]} // form submission errors by field (all arrays must be empty for successful form submission)
        };
        this.clientSideValid = this.clientSideValid.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();
        let form = event.target.elements;
        const email = form.email.value.trim();
        const confirm_email = form.confirm_email.value.trim();
        const notify = Array.from(form.notify).filter((ele) => {return ele.checked}).map((ele) => ele.value); // getting only checked consoles
        this.setState({email: email, confirm_email:confirm_email,notify:notify},async () => {
            const clientSideValid = this.clientSideValid(); // do client-side validation (no need to waste API calls)
            if(clientSideValid) {
                const userAdded = await this.addUser(); // attempt to add user
                if(userAdded) { // if submission is success...
                    this.props.toggleModal(); // close modal
                    this.props.setSuccessMessage(`${email} has been added to the mailing list.`); // success message to be displayed
                }
            }
        });
    }

    // does preliminary validation of a form upon submit - most of our validation is just basic field parsing, we shouldn't need to call the endpoint if we don't need to 
    clientSideValid() {
        let errors = {'email':[],'confirm_email':[],'notify':[]}; // wipe error slate clean for each submission
        // this regex tests for valid email strings (x@y.z format)
        const validEmail = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if(!this.state.email) { errors['email'].push('This field is required.'); }
        if(!this.state.confirm_email) { errors['confirm_email'].push('This field is required.'); };
        if(this.state.confirm_email !== this.state.email) { errors['confirm_email'].push('Emails do not match.'); }
        else if(!validEmail.test(this.state.email)) { errors['email'].push('Email is invalid.'); }
        if(this.state.notify.length < 1) { errors['notify'].push('At least one console must be selected.'); } // console notification preferences must not be empty

        this.setState({errors:errors});
        return formIsValid(errors);
    }

    // attempts to call the endpoint for creating new users - return is boolean based on successful call or not
    async addUser() {
        const payload = generateUserPayload(this.state.email,this.state.notify); // generate JSON payload for POST request
        let success = false;
        try {
            await axios.post('http://192.168.0.224:5000/api/user/new',payload,{headers: {'Content-Type':'application/json'}});
            success = true;
        }
        catch(err) {
            if(err.response.status === 409) { // status 409 = email already exists, user must sign up with different email
                let errors = this.state.errors;
                errors['email'].push("This email is already on the mailing list.");
                this.setState({errors:errors});
            }
        }
        return success;
    }

    render() {
        return (
            <form id="join" onSubmit={this.handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email" className="font-weight-bold">Email*</label>
                    {renderErrors('email',this.state.errors['email'])}
                    <input type="email" className="form-control" name="email" required />
                    <small className="form-text">Any stock updates will be sent to this email.</small>
                </div>
                <div className="form-group">
                    <label htmlFor="confirm_email" className="font-weight-bold">Confirm Email*</label>
                    {renderErrors('confirm_email',this.state.errors['confirm_email'])}
                    <input type="email" className="form-control" name="confirm_email" required />
                </div>
                <div className="form-group">
                    <label htmlFor="notify" className="font-weight-bold mr-1">Notify me about*</label>
                    {renderErrors('notify',this.state.errors['notify'])}
                        <fieldset>
                        <div className="form-check form-check-inline">
                            <input type="checkbox" name="notify" className="form-check-input" value="series_x" />
                            <label className="form-check-label" htmlFor="notify">Microsoft Xbox Series X</label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input type="checkbox" name="notify" className="form-check-input" value="series_s" />
                            <label className="form-check-label" htmlFor="notify">Microsoft Xbox Series S</label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input type="checkbox" name="notify" className="form-check-input" value="ps5" />
                            <label className="form-check-label" htmlFor="notify">Sony Playstation 5</label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input type="checkbox" name="notify" className="form-check-input" value="ps5d" />
                            <label className="form-check-label" htmlFor="notify">Sony Playstation 5 Digital Edition</label>
                        </div>
                        <small className="form-text">You will only receive stock updates for consoles you select here. At least one must be checked.</small>
                    </fieldset>
                </div>
            </form>
        );
    }
}
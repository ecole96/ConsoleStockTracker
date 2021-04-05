import React, { Component } from 'react';
import axios from 'axios';
import {formIsValid, generateUserPayload, renderErrors} from './form-functions.js';

export default class UpdateForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '', // email to update preferences for (not a "Change Email" field)
            notify: [],
            errors: {'email':[],'notify':[]}
        };
        this.clientSideValid = this.clientSideValid.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();
        let form = event.target.elements;
        const email = form.email.value.trim();
        const notify = Array.from(form.notify).filter((ele) => {return ele.checked}).map((ele) => ele.value);
        this.setState({email: email, notify: notify},async () => {
            const clientSideValid = this.clientSideValid();
            if(clientSideValid) {
                const userUpdated = await this.updateUser();
                if(userUpdated) {
                    this.props.toggleModal();
                    this.props.setSuccessMessage(`${email}'s preferences have been updated.`);
                }
            }
        });
    }

    clientSideValid() {
        let errors = {'email':[],'notify':[]};
        const validEmail = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if(!this.state.email) { errors['email'].push('This field is required.'); }
        else if(!validEmail.test(this.state.email)) { errors['email'].push('Email is invalid.'); }
        if(this.state.notify.length < 1) { errors['notify'].push('At least one console must be selected.'); }

        this.setState({errors:errors});
        return formIsValid(errors);
    }

    async updateUser() {
        const payload = generateUserPayload(null,this.state.notify); // email is endpoint URL, so keeping email out of the payload
        let success = false;
        try {
            await axios.post(`http://192.168.0.224:5000/api/user/update/${this.state.email}`,payload,{headers: {'Content-Type':'application/json'}});
            success = true;
        }
        catch(err) {
            if(err.response.status === 404) { // status 404 = email does not exist in database, nothing to update
                let errors = this.state.errors;
                errors['email'].push("This email is not on the mailing list.");
                this.setState({errors:errors});
            }
        }
        return success;
    }

    render() {
        return (
            <form id="update" onSubmit={this.handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email" className="font-weight-bold">Email*</label>
                    {renderErrors('email',this.state.errors['email'])}
                    <input type="email" className="form-control" name="email" required />
                    <small className="form-text">
                        This is not a field to change your email - the email typed here must match the one you're currently signed up with.
                        To change emails, delete your current registration and sign up again.
                    </small>
                </div>
                <div className="form-group">
                    <label htmlFor="notify" className="font-weight-bold">Notify me about*</label>
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
                        <small className="form-text">Any selections here will override your current preferences. At least one must be checked.</small>
                    </fieldset>
                </div>
            </form>
        );
    }
}
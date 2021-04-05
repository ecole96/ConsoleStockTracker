import React, { Component } from 'react';
import axios from 'axios';
import './form-functions';
import {formIsValid, renderErrors} from './form-functions.js';

export default class LeaveForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '', // email to be deleted
            errors: {'email':[]}
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();
        let form = event.target.elements;
        const email = form.email.value.trim();
        this.setState({email: email},async () => {
            const clientSideValid = this.clientSideValid();
            if(clientSideValid) {
                const userDeleted = await this.deleteUser();
                if(userDeleted) {
                    this.props.toggleModal();
                    this.props.setSuccessMessage(`${email} has been removed from the mailing list.`);
                }
            }
        });
    }

    clientSideValid() {
        let errors = {'email':[]};
        const validEmail = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if(!this.state.email) { errors['email'].push('This field is required.'); }
        else if(!validEmail.test(this.state.email)) { errors['email'].push('Email is invalid.'); }

        this.setState({errors:errors});
        return formIsValid(errors);
    }

    async deleteUser() {
        let success = false;
        try {
            await axios.delete(`http://192.168.0.224:5000/api/user/delete/${this.state.email}`);
            success = true;
        }
        catch(err) {
            if(err.response.status === 404) { // status 404 = email does not exist in database, nothing to remove
                let errors = this.state.errors;
                errors['email'].push("This email is not on the mailing list.");
                this.setState({errors:errors});
            }
        }
        return success;
    }

    render() {
        return (
            <form id="leave" onSubmit={this.handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email" className="font-weight-bold">Email*</label>
                    {renderErrors('email',this.state.errors['email'])}
                    <input type="email" className="form-control" name="email" required />
                    <small className="form-text">
                        You will no longer receive stock updates at this email.
                    </small>
                </div>
            </form>
        );
    }
}
import React, { Component } from 'react';
import {Modal, Alert} from 'react-bootstrap';
import JoinForm from './join-form.component';
import UpdateForm from './update-form.component';
import LeaveForm from './leave-form.component';

export default class Actions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false, // when true, modal appears on-screen
            modalTitle: '', // modal window header 
            form: null, // form rendered dependent upon which button clicked
            formName: '', // used to generate form id to connect submit button (as it is outside of the <form> element)
            success_msg:'' // message rendered upon successful form submit
        };
        this.initializeModal = this.initializeModal.bind(this);
        this.toggleModal = this.toggleModal.bind(this);
        this.setSuccessMessage = this.setSuccessMessage.bind(this);
    }

    initializeModal(title,form,formName) { // initialize modal window with the appropriate form based on which action button was clicked
        this.setState({showModal: true, modalTitle: title, form: form, formName: formName});
    }

    toggleModal() { // toggles modal visibility state
        this.setState({showModal: !this.state.showModal});
    }

    setSuccessMessage(text) { // sets message to be displayed upon successful form submit
        this.setState({success_msg:text});
    }

    render() {
        return (
            <div className="actions mb-3">
                <Modal contentClassName="bg-dark text-white" show={this.state.showModal} onHide={() => this.toggleModal()}>
                    <Modal.Header closeButton>
                        <Modal.Title>{this.state.modalTitle}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {this.state.form}
                    </Modal.Body>
                    <Modal.Footer><button type="submit" form={this.state.formName} className="btn btn-primary">Submit</button></Modal.Footer>
                </Modal>
                <Alert variant="success" show={Boolean(this.state.success_msg)} onClose={() => this.setState({success_msg:''})} dismissible>
                    {this.state.success_msg}
                </Alert> 
                <div className="btn-group" role="group" aria-label="Mailing List Actions">
                    <button type="button" className="btn btn-success btn-lg border border-dark" onClick={() => this.initializeModal("Join Mailing List", <JoinForm toggleModal={this.toggleModal} setSuccessMessage={this.setSuccessMessage} />,"join")}>Join Mailing List</button>
                    <button type="button" className="btn btn-primary btn-lg border border-dark" onClick={() => this.initializeModal("Update Mailing List",<UpdateForm toggleModal={this.toggleModal} setSuccessMessage={this.setSuccessMessage} />,"update")}>Update Preferences</button>
                    <button type="button" className="btn btn-danger btn-lg border border-dark" onClick={() => this.initializeModal("Leave Mailing List",<LeaveForm toggleModal={this.toggleModal} setSuccessMessage={this.setSuccessMessage} />,"leave")}>Leave Mailing List</button>
                </div>
                
            </div>
        );
    }
}
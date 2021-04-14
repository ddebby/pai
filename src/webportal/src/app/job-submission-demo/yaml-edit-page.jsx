// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { cloneDeep, debounce, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import {
  DefaultButton,
  MessageBar,
  MessageBarType,
  PrimaryButton,
} from 'office-ui-fabric-react';
import { Flex } from './elements';
import { SaveTemplateDialog } from './components/save-template-dialog';
import MonacoEditor from '../components/monaco-editor';
import { JobProtocol } from './models/job-protocol';
import { submitJob } from './utils/conn';
import config from '../config/webportal.config';

const loginUser = cookies.get('user');

const PureYamlEditPage = ({ jobProtocol, onJobProtocolChange }) => {
  const [protocolYaml, setProtocolYaml] = useState(
    'Paste or import your yaml here...',
  );
  const [validStatus, setValidStatus] = useState({
    message: 'Warning: Not init with yaml yet',
    barType: MessageBarType.warning,
  });
  const [hideDialog, setHideDialog] = useState(true);
  const [isReadOnly, handleReadOnly] = useState(true);

  useEffect(() => {
    const protocol = new JobProtocol(jobProtocol);
    setProtocolYaml(protocol.toYaml());
  }, [jobProtocol]);

  useEffect(() => {
    const valid = JobProtocol.validateFromYaml(protocolYaml);
    if (!isEmpty(valid)) {
      if (protocolYaml !== 'Paste or import your yaml here...')
        setValidStatus({ message: valid, barType: MessageBarType.error });
    } else {
      setValidStatus({
        message: 'Success: Validation completed successfully',
        barType: MessageBarType.success,
      });
    }
  }, [protocolYaml]);

  const toggleHideDialog = () => {
    setHideDialog(!hideDialog);
  };

  const onTextChange = protocolYaml => {
    setProtocolYaml(protocolYaml);
  };

  const onEdit = () => {
    handleReadOnly(false);
  };

  const onSave = () => {
    const updatedJob = JobProtocol.fromYaml(protocolYaml);
    onJobProtocolChange({ ...updatedJob });
    handleReadOnly(true);
  };

  const onSubmit = async e => {
    e.preventDefault();
    const protocol = cloneDeep(jobProtocol);
    try {
      await submitJob(protocol.toYaml());
      window.location.href = `/job-detail.html?username=${loginUser}&jobName=${protocol.name}`;
    } catch (err) {
      alert(err);
    }
  };

  return (
    <>
      <Flex flexDirection='column' flex='1 1 100%'>
        <MessageBar messageBarType={validStatus.barType}>
          {validStatus.message}
        </MessageBar>
        <MonacoEditor
          style={{ flex: '1 1 100%' }}
          monacoProps={{
            theme: 'vs',
            onChange: debounce(onTextChange, 100),
            value: protocolYaml,
            options: {
              language: 'yaml',
              wordWrap: 'on',
              readOnly: isReadOnly,
            },
          }}
        />
      </Flex>
      <Flex justifyContent='flex-end' padding='m' marginTop='m' bg='white'>
        {isReadOnly && (
          <DefaultButton styles={{ root: { marginRight: 8 } }} onClick={onEdit}>
            Edit
          </DefaultButton>
        )}
        {!isReadOnly && (
          <DefaultButton styles={{ root: { marginRight: 8 } }} onClick={onSave}>
            Save
          </DefaultButton>
        )}
        <PrimaryButton onClick={onSubmit}>Submit</PrimaryButton>
        {config.saveTemplate === 'true' && (
          <DefaultButton onClick={toggleHideDialog}>
            Save to Templates
          </DefaultButton>
        )}
      </Flex>
      <SaveTemplateDialog
        hideDialog={hideDialog}
        toggleHideDialog={toggleHideDialog}
      />
    </>
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol => {
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol });
  },
});

export const YamlEditPage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureYamlEditPage);

PureYamlEditPage.propTypes = {
  jobProtocol: PropTypes.object,
  onJobProtocolChange: PropTypes.func,
};
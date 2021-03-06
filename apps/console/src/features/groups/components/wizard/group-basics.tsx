/**
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { getUserStoreList } from "@wso2is/core/api";
import { TestableComponentInterface } from "@wso2is/core/models";
import { Field, FormValue, Forms, Validation } from "@wso2is/forms";
import React, { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Grid, GridColumn, GridRow } from "semantic-ui-react";
import { SharedUserStoreConstants } from "../../../core/constants";
import { SharedUserStoreUtils } from "../../../core/utils";
// TODO: Remove this once the api is updated.
import {
    APPLICATION_DOMAIN,
    INTERNAL_DOMAIN
} from "../../../roles/constants";
import { searchGroupList } from "../../api";
import { CreateGroupFormData, SearchGroupInterface } from "../../models";

/**
 * Interface to capture group basics props.
 */
interface GroupBasicProps extends TestableComponentInterface {
    dummyProp?: string;
    triggerSubmit: boolean;
    initialValues: any;
    onSubmit: (values: any) => void;
}

/**
 * Component to capture basic details of a new role.
 *
 * @param props Group Basic prop types
 */
export const GroupBasics: FunctionComponent<GroupBasicProps> = (props: GroupBasicProps): ReactElement => {

    const {
        onSubmit,
        triggerSubmit,
        initialValues,
        [ "data-testid" ]: testId
    } = props;

    const { t } = useTranslation();

    const [ isValidGroupName, setIsValidGroupName ] = useState<boolean>(true);
    const [ isGroupNamePatternValid, setIsGroupNamePatternValid ] = useState<boolean>(true);
    const [ updatedGroupName, setUpdatedGroupName ] = useState<string>(initialValues?.roleName);
    const [ userStoreOptions, setUserStoresList ] = useState([]);
    const [ userStore, setUserStore ] = useState<string>(SharedUserStoreConstants.PRIMARY_USER_STORE);
    const [ isRegExLoading, setRegExLoading ] = useState<boolean>(false);

    /**
     * Triggers when updatedGroupName is changed.
     */
    useEffect(() => {
        setIsValidGroupName(false);
        validateGroupName(updatedGroupName);
    }, [ updatedGroupName ]);

    useEffect(() => {
        getUserStores();
    }, []);

    /**
     * Contains domains needed for role creation.
     *
     * Note : Since primary domain is available all time,
     *        hardcoded in the dropdown elements.
     *
     * TODO : Discuss and add or remove the Hybrid domains
     *        to the dropdown.
     */
    const groupDomains = [{
        key: -1, text: SharedUserStoreConstants.PRIMARY_USER_STORE, value: SharedUserStoreConstants.PRIMARY_USER_STORE
    }];

    const roleDomains = [{
        key: -1, text: APPLICATION_DOMAIN, value: APPLICATION_DOMAIN
    },{
        key: 0, text: INTERNAL_DOMAIN, value: INTERNAL_DOMAIN
    }];

    /**
     * Util method to validate if the provided role name exists in the system.
     *
     * @param groupName - new role name user entered.
     */
    const validateGroupName = (groupName: string): void => {
        const searchData: SearchGroupInterface = {
            filter: "displayName eq " + groupName,
            schemas: [
                "urn:ietf:params:scim:api:messages:2.0:SearchRequest"
            ],
            startIndex: 1
        };

        searchGroupList(searchData)
            .then((response) => {
                setIsValidGroupName(response?.data?.totalResults === 0);
            });
    };

    /**
     * The following function change of the user stores.
     *
     * @param values
     */
    const handleDomainChange = (values: Map<string, FormValue>) => {
        const domain: string = values.get("domain").toString();
        setUserStore(domain);
    };

    /**
     * The following function validates role name against the user store regEx.
     *
     * @param roleName - User input role name
     */
    const validateGroupNamePattern = async (roleName: string): Promise<void> => {
        let userStoreRegEx = "";
        if (userStore !== SharedUserStoreConstants.PRIMARY_USER_STORE) {
            await SharedUserStoreUtils.getUserStoreRegEx(userStore,
                SharedUserStoreConstants.USERSTORE_REGEX_PROPERTIES.RolenameRegEx)
                .then((response) => {
                    setRegExLoading(true);
                    userStoreRegEx = response;
                })
        } else {
            userStoreRegEx = SharedUserStoreConstants.PRIMARY_USERSTORE_PROPERTY_VALUES.RolenameJavaScriptRegEx;
        }
        setIsGroupNamePatternValid(SharedUserStoreUtils.validateInputAgainstRegEx(roleName, userStoreRegEx));
    };

    /**
     * The following function fetch the user store list and set it to the state.
     */
    const getUserStores = () => {
        const storeOptions = [
            {
                key: -1,
                text: "Primary",
                value: "primary"
            }
        ];
        let storeOption = {
            key: null,
            text: "",
            value: ""
        };
        getUserStoreList()
            .then((response) => {
                if (storeOptions === []) {
                    storeOptions.push(storeOption);
                }
                response.data.map((store, index) => {
                        storeOption = {
                            key: index,
                            text: store.name,
                            value: store.name
                        };
                        storeOptions.push(storeOption);
                    }
                );
                setUserStoresList(storeOptions);
            });

        setUserStoresList(storeOptions);
    };

    /**
     * The following function handles the change of the username.
     *
     * @param values - form values from the listen event.
     */
    const groupNameChangeListener = (values: Map<string, FormValue>): void => {
        const groupName: string = values?.get("groupName")?.toString();
        setUpdatedGroupName(groupName);
        validateGroupNamePattern(groupName)
            .finally(() => {
                setRegExLoading(false);
            })
    };

    /**
     * Util method to collect form data for processing.
     *
     * @param values - contains values from form elements
     */
    const getFormValues = (values: any): CreateGroupFormData => {
        return {
            domain: values.get("domain").toString(),
            groupName: values.get("groupName").toString()
        };
    };

    return (
        <Forms
            data-testid={ testId }
            onSubmit={ (values) => {
                onSubmit(getFormValues(values));
            } }
            submitState={ triggerSubmit }
        >
            <Grid>
                <GridRow columns={ 2 }>
                    <GridColumn mobile={ 16 } tablet={ 16 } computer={ 8 }>
                        <Field
                            data-testid={ `${ testId }-domain-dropdown` }
                            type="dropdown"
                            label={ t("adminPortal:components.roles.addRoleWizard.forms.roleBasicDetails." +
                                "domain.label.group") }
                            name="domain"
                            children={ userStoreOptions }
                            placeholder={ t("adminPortal:components.roles.addRoleWizard.forms.roleBasicDetails." +
                                "domain.placeholder") }
                            requiredErrorMessage={ t("adminPortal:components.roles.addRoleWizard.forms." +
                                "roleBasicDetails.domain.validation.empty.group") }
                            required={ true }
                            element={ <div></div> }
                            listen={ handleDomainChange }
                            value={ initialValues?.domain ? initialValues?.domain : userStoreOptions[0]?.value }
                        />
                    </GridColumn>
                    <GridColumn mobile={ 16 } tablet={ 16 } computer={ 8 }>
                        <Field
                            data-testid={ `${ testId }-role-name-input` }
                            type="text"
                            name="groupName"
                            label={ t("adminPortal:components.roles.addRoleWizard.forms.roleBasicDetails." +
                                "roleName.label",{ type: "Group" }) }
                            placeholder={ t("adminPortal:components.roles.addRoleWizard.forms." +
                                "roleBasicDetails.roleName.placeholder", { type: "Group" }) }
                            required={ true }
                            requiredErrorMessage={ t("adminPortal:components.roles.addRoleWizard.forms." +
                                "roleBasicDetails.roleName.validations.empty", { type: "Group" }) }
                            validation={ (value: string, validation: Validation) => {
                                if (isValidGroupName === false) {
                                    validation.isValid = false;
                                    validation.errorMessages.push(t("adminPortal:components.roles.addRoleWizard." +
                                        "forms.roleBasicDetails.roleName.validations.duplicate",
                                        { type: "Group" }));
                                }
                                if (!isGroupNamePatternValid) {
                                    validation.isValid = false;
                                    validation.errorMessages.push(t("adminPortal:components.roles.addRoleWizard" +
                                        ".forms.roleBasicDetails.roleName.validations.invalid",
                                        { type: "group" }));
                                }
                            } }
                            value={ initialValues && initialValues.groupName }
                            listen={ groupNameChangeListener }
                            loading={ isRegExLoading }
                        />
                    </GridColumn>
                </GridRow>
            </Grid>
        </Forms>
    )
};

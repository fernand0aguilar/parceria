import React from "react";
import { Formik, Form } from "formik";
import {
  Button,
  makeStyles,
  createStyles,
  Theme,
  InputAdornment,
} from "@material-ui/core";
import useCreatePosting from "../../hooks/useCreatePosting";
import MyTextField from "../../components/MyTextField";
import UploadPhotosField from "./UploadPhotosField";
import ConditionField from "./ConditionField";
import { postingFormValidationSchema } from "../../common/postingFormValidationSchema";
import { postingFormInitialValues } from "../../common/postingFormManagement";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      marginTop: theme.spacing(8),
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    form: {
      width: "100%", // Fix IE 11 issue.
      marginTop: theme.spacing(1),
    },
    submit: {
      margin: theme.spacing(3, 0, 2),
    },
  }),
);

export default function CreatePostingForm(): React.ReactElement {
  const classes = useStyles();
  const { handleSubmit } = useCreatePosting();

  return (
    <Formik
      initialValues={postingFormInitialValues}
      onSubmit={handleSubmit}
      validationSchema={postingFormValidationSchema}
    >
      {({ isSubmitting }) => (
        <Form noValidate className={classes.form}>
          <MyTextField name="title" type="text" label="Title" autoFocus />
          <MyTextField
            name="price"
            type="number"
            label="Price"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
          />
          <ConditionField />
          <MyTextField
            name="description"
            type="text"
            label="Description"
            multiline
            rows={5}
          />
          <MyTextField name="phone" type="tel" label="Phone" />
          <MyTextField name="city" type="text" label="City" />
          <UploadPhotosField name="photos" />
          <Button
            color="primary"
            size="large"
            variant="contained"
            type="submit"
            fullWidth
            className={classes.submit}
            disabled={isSubmitting}
          >
            Add
          </Button>
        </Form>
      )}
    </Formik>
  );
}

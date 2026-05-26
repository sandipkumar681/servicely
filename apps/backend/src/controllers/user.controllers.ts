import { ApiError } from "../utils/apiError";
import { AsyncHandler } from "../utils/asyncHandler";
import { registerSchemaBody } from "@NursingPracticer/schemas";
import { validateData } from "@NursingPracticer/utils";

const signUpUser = AsyncHandler(async (req, res) => {
  const data = validateData(registerSchemaBody, req.body);

  // const { email, phone, userEmailOtp, userPhoneOtp } = data;
});

export { signUpUser };

import { ApiResponse } from "../utils/apiResponse";
import { AsyncHandler } from "../utils/asyncHandler";

const healthcheck = AsyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Connected to NursingPracticer backend successfully!",
      ),
    );
});

export { healthcheck };

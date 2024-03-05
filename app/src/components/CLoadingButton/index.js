import React, { useState } from "react";
import { LoadingButton } from "@mui/lab";

const CLoadingButton = ({color, onClickHandler, title}) => {
    const [isLoading, setIsLoading] = useState(false);

    const clickHandler = async () => {
        setIsLoading(true);
        await onClickHandler();
        setIsLoading(false);
    }

    return (
        <LoadingButton 
            disabled={isLoading} 
            loading={isLoading} 
            variant='contained'
            color={color}
            onClick={clickHandler}
        >
            {title}
        </LoadingButton>
    );
};

export default CLoadingButton;
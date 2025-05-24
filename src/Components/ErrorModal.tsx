import { Code, Modal, Title } from "@mantine/core";
import { LatestError } from "../Types/LatestError";

export const ErrorModal: React.FC<{
    opened: boolean;
    onClose: () => void;
    error: LatestError | null;
}> = ({ opened, onClose, error }) => {
    if (!error) {
        return;
    }

    return (
        <Modal
            centered
            radius="1rem"
            style={{ width: "50rem" }}
            opened={opened}
            autoFocus={false}
            onClose={onClose}
            transitionProps={{ transition: "pop" }}
            closeOnEscape={!error.isFatal}
            closeOnClickOutside={!error.isFatal}
            withCloseButton={!error.isFatal}
            fullScreen={error.isFatal}
        >
            <Title>
                {error.isFatal && "Fatal Error: "}
                {error.message}
            </Title>
            {error.error.message}
            <Code block style={{}}>
                {error.error.stack}
            </Code>
        </Modal>
    );
};

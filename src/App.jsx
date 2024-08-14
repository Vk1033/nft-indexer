import { Box, Button, Center, Flex, Heading, Image, Input, SimpleGrid, Text, CircularProgress } from "@chakra-ui/react";
import { Alchemy, Network } from "alchemy-sdk";
import { useState } from "react";

function App() {
  const [userAddress, setUserAddress] = useState("");
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ifError, setIfError] = useState(false);

  async function getWalletNFTs() {
    setHasQueried(false);
    setLoading(true);
    if (!window.ethereum.selectedAddress) {
      await window.ethereum.request({ method: "eth_requestAccounts" });
    }
    getNFTsForOwner(null, window.ethereum.selectedAddress);
  }

  async function getNFTsForOwner(_, queryAddress = userAddress) {
    setHasQueried(false);
    setLoading(true);
    const config = {
      apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    let data;
    try {
      data = await alchemy.nft.getNftsForOwner(queryAddress);
    } catch (e) {
      console.error(e);
      setIfError(true);
      setLoading(false);
      return;
    }
    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < Math.min(data.ownedNfts.length, 10); i++) {
      const tokenData = alchemy.nft.getNftMetadata(data.ownedNfts[i].contract.address, data.ownedNfts[i].tokenId, {});
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
    setLoading(false);
    setIfError(false);
  }
  return (
    <Box w="100vw">
      <Center>
        <Flex alignItems={"center"} justifyContent="center" flexDirection={"column"}>
          <Heading mb={0} fontSize={36}>
            NFT Indexer 🖼
          </Heading>
          <Text>Plug in an address and this website will return all of its NFTs!</Text>
        </Flex>
      </Center>
      <Flex w="100%" flexDirection="column" alignItems="center" justifyContent={"center"}>
        <Heading mt={42}>Get the NFTs (ERC-721 tokens) of this address (10 due to ratelimit) :</Heading>
        <Input onChange={(e) => setUserAddress(e.target.value)} color="black" w="600px" textAlign="center" p={4} bgColor="white" fontSize={24} />
        {ifError ? <Text color="red">Error fetching NFTs</Text> : null}
        <Button fontSize={20} onClick={getNFTsForOwner} mt={36} bgColor="blue">
          Fetch NFTs
        </Button>
        <Button fontSize={20} onClick={getWalletNFTs} mt={36} bgColor="blue">
          Fetch Wallet NFTs
        </Button>

        {hasQueried ? (
          <SimpleGrid w={"90vw"} columns={4} spacing={24}>
            {results.ownedNfts.length === 0 ? (
              <Heading my={36} justifySelf="center">
                No NFTs found
              </Heading>
            ) : (
              <Heading my={36}>Here are your NFTs:</Heading>
            )}
            {results.ownedNfts.map((e, i) => {
              if (tokenDataObjects[i] === undefined) return;
              return (
                <Flex flexDir={"column"} color="white" bg="blue" w={"20vw"} key={i}>
                  <Box>
                    <b>Name:</b> {tokenDataObjects[i].title?.length === 0 ? "No Name" : tokenDataObjects[i].title}
                  </Box>
                  <Image src={tokenDataObjects[i]?.rawMetadata?.image ?? "https://via.placeholder.com/200"} alt={"Image"} />
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : loading ? (
          <CircularProgress margin={100} isIndeterminate />
        ) : null}
      </Flex>
    </Box>
  );
}

export default App;
